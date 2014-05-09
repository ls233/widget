# 
#  @package Data Import Widget
#  @author German Nudelman
#  
#  This file prints heatmap from Bioconductor eSet
# 

library(gplots)
library(rjson)
library(fastcluster)

############## my functions ######################################################
printHeatmap2 <- function(x, file=FALSE, filename, col=redgreen(75), Rowv=TRUE, Colv=TRUE,
                          dendrogram=c("none"), xlab=NULL, ylab=NULL,
                          key=TRUE, keysize=0.8, trace="none",
                          density.info=c("none"), labRow=NULL,
                          labCol=NULL,  main=NULL, margins=c(10, 3),
                          height, width, bg){
  if(file) 
    if(exists("height",mode="number") &&  exists("width",mode="number")){
      #png(filename, bg = bg)
      cat("height, width exist")
      png(filename, bg = bg, height=height, width=width)
    }
    else
      png(filename, bg = bg)
  heatmap.2(x,
            Rowv = Rowv, 
            Colv = Colv,          
            dendrogram = dendrogram,
            distfun = dist,
            hclustfun = hclust,
            xlab = xlab, ylab = ylab,            
            key = key,
            keysize = keysize,
            trace = trace,
            density.info = density.info,
            margins = margins,
            col = col,
            main = main,
            labRow = labRow, 
            labCol = labCol,
            cexCol=0.9
  )
  if(file) dev.off()
}

#-----------------------------------------------------------------------


#TRUE#FALSE
.jsonfile<-TRUE
.DEBUG<-FALSE
logmsg<-""
pngfile<-""

if(.DEBUG){
  setwd("c:/Apache/htdocs/widget/lib/server/insilico/")  
}
setwd("./inSilicoDB/")  
args<-c("heatmapSettings.txt")
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

#processinput<-function(input){
#    input<-input$input
output<-list()
output$input<-input
output$status<-"failure"

# para<-input$params
# checkpara<-function(para){
#   if(para$tol<0 | para$tol>1){
#     output$message<<-"tol is out of range"
#     return(FALSE)
#   }else if(para$h0<1 |para$h0>10){
#     output$message<<-"h0 is out of range"
#     return(FALSE)
#   }else if(para$h<1 |para$h>15){
#     output$message<<-"h is out of range"
#     return(FALSE)
#   }
#   return(TRUE)
# }


#if(!checkpara(para)) return(output)

idir<-chartr("\\", "/", input$folder)
#    browser()
if(!file.exists(idir)){
  output$message<-"the input dir does not exist"
  return(output)
}
odir<-input$folder

#browser()

if(!file.exists(odir)){
  output$message<-"the output dir does not exist"
  return(output)
}

#ifile<-file.path(idir,input$filename)
ifile<-file.path(idir,'fc.RData')

if(!file.exists(ifile)){
  output$message<-"The input file does not exist"
  return(output)
}

#cat(paste("input$folder - ",ifile,"\n"),file=stderr())

load_obj <- function(f) {
  env <- new.env()
  nm <- load(f, env)[1]
  env[[nm]]
}

fc.e <- load_obj(ifile)

heatmapImage<- paste(input$filename,"__heatmap.png", sep="")
heatmapPath<-file.path(idir,heatmapImage)

####  reorder dendogram ###################################
fc.emt.tmp <- fc.e
#colnames(fc.emt.tmp)<-c('0.5h','1h','2h','4h','8h','16h','24h','72h')
fc.emt.tmpT <- t(fc.emt.tmp)
dd<- as.dendrogram(hclust(dist(fc.emt.tmpT)))
#par(mfrow=c(1,2))
#plot(dd)
#unlist(dd)
column.number<-length(colnames(fc.emt.tmp))
dd.reordered <- reorder(dd, c(column.number:1),agglo.FUN= mean)
#plot(dd.reordered)
#unlist(dd.reordered)
#-----------------------------------------------------------------

printHeatmap2(fc.emt.tmp,Colv=dd.reordered,dendrogram = c("both"),main = 'fold change gene expression',file=TRUE, filename=heatmapPath, bg = "transparent",height='700', width='700')
#printHeatmap2(fc.emt.tmp,Colv=dd.reordered,dendrogram = c("both"),main = 'Fold-Change gene expression',bg = "transparent")
###-----------------------------------------------------------------------------------
output$status<-"success"
output$input<-input
output$heatmapImage <- heatmapImage

output<-list(output=output)
outputstr<-toJSON(output)
write(outputstr,"")