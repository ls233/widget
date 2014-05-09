# 
#  @package Data Import Widget
#  @author German Nudelman
#  
#  This file prints cufdiff plots
# 

library(rjson)
#library(RJSONIO)
library(cummeRbund)

# functions definition -------------------------------------------------------
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
.jsonfile <- TRUE
.DEBUG <- FALSE
logmsg <- ""
pngfile <- ""
#args <- character(0)
input <- ''

if(.DEBUG){
  setwd("c:/Apache/htdocs/widget/lib/server/insilico/")  
}
setwd("./inSilicoDB/")  
args<-c("heatmapSettings_cuffDif.txt")
print(args)

if(.jsonfile){ #input sent via file
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
    return(TRUE)
  }
  
  checkfiles<-function(input){
    idir <- chartr("\\", "/", input$folder)
    if(!file.exists(idir)){
      output$message<-"the input dir does not exist"
      return(FALSE)
    }    
    #     odir<-input$folder
    #     if(!file.exists(odir)){
    #       output$message<-"the output dir does not exist"
    #       return(output)
    #     }
    
    ifile<-file.path(idir,input$filename)
    if(!file.exists(ifile)){
      output$message<-"The input file does not exist"
      return(output)
    }
    
    return(TRUE)
  }
  
  if( !(checkparams(input) | checkfiles(input)) ) return(output)
  
  return(TRUE)
}

#if(!processinput(input)) return(output)


# loading input data -------------------------------------------------------
idir <- chartr("\\", "/", input$folder)

ifile<-file.path(idir,input$filename)

cuff_data <- readCufflinks(idir)
replicates<-replicates(cuff_data)
labels.original <- replicates[,'sample_name']
labels.original.unique <- unique(labels.original)
pair<-labels.original.unique

heatmapImage<- paste(input$filename,"__heatmap.png", sep="")
heatmapPath<-file.path(idir,heatmapImage)

png(heatmapPath, bg="transparent", width=600, height=300)
feature.cuff_data <- genes(cuff_data)
#v<-csVolcano(feature.cuff_data,pair[1],pair[2],alpha=0.05,showSignificant=T)
v<-csVolcanoMatrix(feature.cuff_data)
print(v)
dev.off() 


# -----------------------------------------------------------------------------------
output$status<-"success"
output$input<-input
output$heatmapImage <- heatmapImage

output<-list(output=output)
outputstr<-toJSON(output)
write(outputstr,"")