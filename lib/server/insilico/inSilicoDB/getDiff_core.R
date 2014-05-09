library(affy)
#library(simpleaffy)
#library(statmod)
library(limma)
#library(gcrma)
#library(preprocessCore)
library(gplots)
library(rjson)
#library(RJSONIO)
#library(Biobase)

.pardefault <- par() 
# my functions -------------------------------------------------------------------
printbarplot <- function(x,file=FALSE,filename){
  if (file) 
    png(filename, bg = "transparent")
    #png(filename, height=350, width=500,bg = "transparent")

  row.names<-row.names(x)
  labels <- row.names
  position <- 'bottomright'
  colors <- gray.colors(length(row.names))
  inset <- c(0.1, 0.1)
  
  linch <-  max(strwidth(labels, "inch")+12.4, na.rm = TRUE)
#  cat (linch)
  par(mar = c(linch, 4.1, 4.1, 2.1))
  
  barplot(x, main="Differentially-expressed gene statistics", las=1, xlab="# of genes", horiz=T)
  legend(position, labels, fill=colors, inset=inset)
  
  if (file)
    dev.off()
}

#printbarplot(total)

# reading parameters -------------------------------------------------------
.jsonfile<-TRUE
.DEBUG<-FALSE
logmsg<-""
pngfile<-""

if(.DEBUG){
  setwd("./inSilicoDB/")  
  #setwd("c:/Apache/htdocs/widget/")  
  args<-c("getDiffSettings_DEBUG.txt")
}else{
  setwd("./inSilicoDB/")  
  args<-c("getDiffSettings.txt")
}
print(args)

if(.jsonfile){
  if(length(args)!=1){
    stop("The R command specification is incorrect\n")
  }
  
  if(!file.exists(args[1])){
    stop("The R json input file does not exist\n")
  }
  input<-fromJSON(file=args[1])
}else{
  input<-fromJSON(args[1])
}


# checking and processing input -------------------------------------------------------
output<-list()
output$input<-input
output$status<-"failure"

processinput<-function(input){

  checkparams<-function(params){
    if(params$tol<0 | params$tol>1000){
      output$message<-"minimal expression cutoof is out of range"
      return(FALSE)
    }else if(params$FDR<0 |params$FDR>1){
      output$message <-"FDR is out of range"
      return(FALSE)
    }
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

  if( !(checkparams(input$params) | checkfiles(input$dataFileInfo)) ) return(output)

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
eSetO <- load_obj(ifile)

csvFileName<- paste(input$dataFileInfo[['filename']],"__csv_text.txt", sep="")
pDatafile<-file.path(idir,csvFileName)
pDataU <- read.table(pDatafile, header = TRUE, sep = "\t", row.names = 'row.names')


# processing input data ------------------------
pDataU <- pDataU[pDataU$Group.Name != 'TBD',] #filter ungroupped

labels.original <- pDataU[,'Group.Name']
labels.original.unique <- unique(labels.original)
pDataU['Group.Name'] <- lapply(pDataU['Group.Name'], function(x) make.names(x))


#-------------- start analysis ------------------------
labelsU <- pDataU[,'Group.Name']

fU <- factor(labelsU, levels=unique(labelsU))
designU <- model.matrix(~ -1+fU)
colnames(designU) <- unique(labelsU)

eU <- exprs(eSetO)
eU <- eU[ , which(colnames(eU) %in% rownames(pDataU))] #process only user selected samples

pDataAnnotatedU <- new("AnnotatedDataFrame", data = pDataU)
eU <- eU[,rownames(pDataU)] #reorder columns in expres to match pData
esetU <- new("ExpressionSet", exprs = eU, phenoData = pDataAnnotatedU) #create new eSet

colnames(eU) <- labelsU

fitU <- lmFit(esetU, design=designU)
rownames(fitU$coefficients) <- rownames(exprs(esetU))  	
rownames(fitU$stdev.unscaled) <- rownames(exprs(esetU))		

colnames.design <- colnames(designU)
contrasts <- paste(colnames.design[2:length(colnames.design)], colnames.design[1], sep="-")
orig.contrasts.labels <- paste(labels.original.unique[2:length(labels.original.unique)], labels.original.unique[1], sep=" vs ")
contrast.matrixU <- makeContrasts(contrasts=contrasts, levels=designU)

fit2U <- contrasts.fit(fitU,contrast.matrixU)
fit2U <- eBayes(fit2U)

########### Parameters #################################################
min.fold.change <- 1			## Minimum log2 fold change to be differentially expressed
#dens<-density(eU)
#plot(dens)
min.intensity <- input$params$tol       	## Minimum log2 intensity (at any time) to be differentially expressed
p.cutoff <- input$params$FDR				# FDR corrected cutoff for significant differential expression, fefault value is 0.01
#p.cutoff <- 0.5 # testing
fdr.method <- "BH"			## FDR correction method (eg, BH or none) (for NDV)
fdr.method.control <- "BH"		## FDR correction method (eg, BH or none) (for AF (control))

# filter by min intensity ------------------------------------------------------------------------
if (min.intensity > 0) { ## Remove probesets that do not meet minimum intensity)
  ## (this occurs before decideTests to help with multiple testing)  
  de.rowsU <- which(apply(eU,1,max) >= min.intensity)    
  fit2.filteredU <- fit2U[de.rowsU,]    #remove genes that are below min.intensity
  e.filteredU <- eU[de.rowsU,]         	#remove genes that are below min.intensity
}

results.fgU <- decideTests(fit2.filteredU,adjust.method=fdr.method,p.value=p.cutoff,lfc=min.fold.change) # diff call
colnames(results.fgU) <- as.vector(orig.contrasts.labels) #replacing col names back to the original ones


de.rowsU <- which(apply(results.fgU,1,any))
if(length(de.rowsU) != 0) {#any DE found (UP or DOWN)
  results.fgU <- results.fgU[de.rowsU,]  			##remove genes that are not differentially-expressed from results
  # calculate DE gene statistics --------------------------------------------
  rows.up <- which(apply(results.fgU, 1, function(x){any(x== 1)}))  #UP
  genes.up<-names(rows.up)
  #lengthUP<-length(genesUP)
  genes.up.file<- paste(input$dataFileInfo[['filename']],"__DEgenesUP.txt", sep="")
  genes.up.file.Path<-file.path(idir,genes.up.file)
  fileConn<-file(genes.up.file.Path)
  writeLines(genes.up, fileConn)
  close(fileConn)
  
  rows.down <- which(apply(results.fgU, 1, function(x){any(x== -1)}))  #UP
  genes.down<-names(rows.down)
  #length.down<-length(genes.down)
  genes.down.file<- paste(input$dataFileInfo[['filename']],"__DEgenesDOWN.txt", sep="")
  genes.down.file.Path<-file.path(idir,genes.down.file)
  fileConn<-file(genes.down.file.Path)
  writeLines(genes.down, fileConn)
  close(fileConn)  

  up <- apply(results.fgU, 2, function(x){length(which(t(x) == 1))})  #UP
  down <- apply(results.fgU, 2, function(x){length(which(t(x) == -1))})  #down
  total <- rbind(up,down)
  colnames(total) <- orig.contrasts.labels #replacing col names back to the original ones
    
  barplotImage<- paste(input$dataFileInfo[['filename']],"__DEnumber.png", sep="")
  densImagePath<-file.path(idir,barplotImage)
  printbarplot(total, file=TRUE, filename=densImagePath)
  
  # FC calc ------------------------------------------------------- 
  e.filtered.fgU <- e.filteredU[de.rowsU,]					##remove genes that are not differentially-expressed from results
  colnames(e.filtered.fgU)<-labelsU
  
  sum.e <- (e.filtered.fgU %*% designU)                 ## sum of expression values for each category
  num <- apply(designU,2,sum)                    ## number of arrays in each category
  avg.e <- t(apply(sum.e,1,function(x) x/num))  ## average expression value
  fc.e <- avg.e %*% contrast.matrixU              ## fold-change for each of the contrasts
  colnames(fc.e) <- as.vector(orig.contrasts.labels) #replacing col names back to the original ones
  
  fc.file<- "fc.RData";
  fc.Path<-file.path(idir,fc.file)
  save(fc.e, file = fc.Path)
  
  genes.fc.file<- paste(input$dataFileInfo[['filename']],"__DEgenesFoldChange.txt", sep="")
  genes.fc.file.Path<-file.path(idir,genes.fc.file)
  write.table(fc.e, file = genes.fc.file.Path, quote=F, sep='\t', row.names=T, col.names=NA)
  
  files<-c(genes.fc.file.Path, genes.down.file.Path, genes.up.file.Path)
  zip.file<- paste(input$dataFileInfo[['filename']],"__DEgenes.zip", sep="")
  zip.file.Path<-file.path(idir,zip.file)  
  zip(zip.file.Path, files, flags = "-r9X", extras = "", zip = Sys.getenv("R_ZIPCMD", "zip"))
  
  # generate the bg list ------------------------------------------------------------
  min.fold.change <- 0  		# generate the bg list
  results.bgU <- decideTests(fit2.filteredU,adjust.method=fdr.method,p.value=p.cutoff,lfc=min.fold.change)
  colnames(results.bgU) <- as.vector(orig.contrasts.labels) #replacing col names back to the original ones
  de.rowsU <- which(apply(results.bgU,1,any))
  results.bg <- results.bgU[de.rowsU,]    		##remove genes that are not differentially-expressed from results
  
  results.bg.filtered.names<-rownames(results.bg)[-which(rownames(results.bg)%in%rownames(results.fgU))]
  results.bg.filtered <- results.bg[rownames(results.bg)%in%results.bg.filtered.names,]
  results.bg.filteredZeros <- results.bg.filtered
  results.bg.filteredZeros[results.bg.filteredZeros < 2] <- 0
  
  results.total <- rbind(results.fgU,results.bg.filteredZeros)
  
  dataFile<- "dataFile.RData";
  dataFile.Path<-file.path(idir,dataFile)
  save(results.total, file = dataFile.Path)
  #-----------------------------------------------------------------

  output$status<-"success"
  output$msg<-"DE analysis looks ok"
  geneData<-list()
  geneData$barplot<-barplotImage
  geneData$fc.file<-fc.file
  geneData$DEGzip<-zip.file
  geneData$filename<-dataFile
  output$geneData <- geneData  
  dataFileInfo<-list()
  dataFileInfo<-input$dataFileInfo
  output$dataFileInfo <- dataFileInfo
}else{
  output$status<-"failure"
  output$msg<-"No DE genes were found"
}

output$input<-input

output<-list(output=output)
outputstr<-toJSON(output)
write(outputstr,"")