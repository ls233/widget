# 
#  @package Data Import Widget
#  @author German Nudelman
#  @usage: R --vanilla --quiet --slave --args input.json output.json < script.R
#
#  This file extructs meta data from Bioconductor eSet and matches the taxon using entrez eutilis
# 


# reading parameters -------------------------------------------------------
.jsonfile<-TRUE
.DEBUG<-FALSE #FALSE
logmsg<-""
pngfile<-""
input<-""
library(rjson)
#library(RJSONIO)
library(affy)
#library(Biobase)
library(preprocessCore)
library(rentrez)

if(.DEBUG){
  setwd("c:/Apache/htdocs/widget/lib/server/insilico/")  
}
setwd("./inSilicoDB/")  
args<-c("get_pData_Settings.txt")
print(args)

if(.jsonfile){ #input sent via file
  if(length(args)!=1){
    stop("The R command specification is incorrect\n")
  }
  
  if(!file.exists(args[1])){
    stop("The R json input file does not exist\n")
  }
  input<-fromJSON(file=args[1])
  #input<-fromJSON(args[1])
}else{
  input<-fromJSON(args[1])
}


# checking and processing input -------------------------------------------------------
output<-list()
output$input<-input
output$status<-"failure"

detectTaxon<-function(gse.id){
  query <- paste(gse.id,"[ACCN]+GSE[ETYP]",sep='')
  web_env_search <- entrez_search(db="gds", query, usehistory="y")
  if( length(web_env_search$ids) != 1)
    return(NA)
  cookie <- web_env_search$WebEnv
  qk <- web_env_search$QueryKey
  pop_summ <- entrez_summary(db="gds", query_key=1, WebEnv=cookie)
  taxon<-pop_summ[["taxon"]]
}

processinput<-function(input){
  
  checkparams<-function(params){
    #check parameters here when passed
    return(TRUE)
  }
  
  checkfiles<-function(dataFileInfo){
    idir <- chartr("\\", "/", dataFileInfo$folder)
    if(!file.exists(idir)){
      output$message<-"the input dir does not exist"
      return(FALSE)
    }    
    #     odir<-input$folder
    #     if(!file.exists(odir)){
    #       output$message<-"the output dir does not exist"
    #       return(output)
    #     }
    
    ifile<-file.path(idir,dataFileInfo$filename)
    if(!file.exists(ifile)){
      output$message<-"The input file does not exist"
      return(output)
    }
    
    return(TRUE)
  }
  
  
  if(!checkfiles(input$dataFileInfo)) return(output)
  
  return(TRUE)
}

if(!processinput(input)) return(output)


# loading input data -------------------------------------------------------
load_obj <- function(f) {
  env <- new.env()
  nm <- load(f, env)[1]
  env[[nm]]
}

idir <- chartr("\\", "/", input$dataFileInfo$folder)

ifile<-file.path(idir,input$dataFileInfo$filename)
eSet <- load_obj(ifile)

experimentData <- experimentData(eSet)    
expinfo <- expinfo(experimentData)

gse.id <- experimentData@name
try.detectTaxon <- try(detectTaxon(gse.id))
if(class(try.detectTaxon)=="try-error"){
  taxon<-NA
}else{
  taxon <- try.detectTaxon
}


pdata <- pData(eSet)
exprs <- exprs(eSet)

bg.parameters <- bg.parameters(exprs)
min.intensity <- bg.parameters$mu + 2*bg.parameters$sigma

#hiddenIDs <- seq(1:nrow(pdata))
#pData <- cbind(hiddenIDs, pData)

pdataFileName<- paste(input$dataFileInfo[['filename']],"__pdata.txt", sep="")
ofile<-file.path(idir,pdataFileName)
write.table(pdata,file=ofile,sep = "\t",quote=FALSE) # write tidal input file

dens<-density(exprs)
min <- round(min(dens[[1]]))
max <- round(max(dens[[1]]))

densImageFileName<- paste(input$dataFileInfo[['filename']],"__dense.png", sep="")
densImagePath<-file.path(idir,densImageFileName)
png(densImagePath, bg="transparent", width=600, height=300)
plot(dens,main=NA)
dev.off() 

# optional normalisation -----------------------------------------------------
# normalisation function definition
calc.quantiles <- function(x){
  probs <- seq(0.25, 0.75, 0.25)
  quantile(x,  probs = probs)
}
calc.signif <- function(x){
  (max(x)-min(x))/{(max(x)+min(x))/2} < 0.1
}

quantiles <- apply(exprs,2,calc.quantiles)
signif<- apply(quantiles,1,calc.signif)
if(any(signif == FALSE)) {  # at least one quantile doesn't look different
  exprs.normalized <- normalize.quantiles(exprs) ## 
  colnames(exprs.normalized) <- colnames(exprs)
  rownames(exprs.normalized) <- rownames(exprs)
} else{
  exprs.normalized <- exprs
}

# debuging  normalisation testing ----------
# dims <- dim(exprs.normalized)
# exprs.test <- matrix(rnorm(dims[1]*dims[2],mean=6,sd=5), ncol=dims[2])
# boxplot(exprs.test, main="Normalized log2 expression", las=2)
# quantiles <- apply(exprs.test,2,calc.quantiles)
# signif<- apply(quantiles,1,calc.signif)
# signif
# any(signif == FALSE)  # at least one quantile looks different


# plotting expression boxplot --------------------------------------------------
boxplotFileName<-paste(input$dataFileInfo[['filename']],"__boxplot.png", sep="")
boxplotPath<-file.path(idir,boxplotFileName)
png(boxplotPath, bg="transparent", width=500, height=300)
boxplot(exprs.normalized, main="Normalized log2 expression", las=2)
dev.off()

output$status<-"success"
output$expinfo<-expinfo
densData<-list()
densData$densImage<-densImageFileName
densData$min<-min
densData$max<-max
densData$bg_intensity_cutoff<-min.intensity
densData$boxplot<-boxplotFileName
output$densData <- densData  
dataFileInfo<-list()
dataFileInfo<-input$dataFileInfo
output$dataFileInfo <- dataFileInfo
output$taxon <- taxon

output<-list(output=output)
outputstr<-toJSON(output)
write(outputstr,"")


