# 
#  @package Data Import Widget
#  @author German Nudelman
#  @usage: R --vanilla --quiet --slave --args input.json output.json < script.R
#
#  This file extructs meta data from cuffdif results
# 


library(rjson)
#library(RJSONIO)
library(cummeRbund)

# reading parameters -------------------------------------------------------
.jsonfile<-T
.DEBUG<-F
logmsg<-""
pngfile<-""
input<-""

if(.DEBUG){
  setwd("c:/Apache/htdocs/widget/lib/server/insilico/")
}
setwd("./inSilicoDB/")  
args<-c("get_pData_Settings_cufDiff.txt")
print(args)

if(.jsonfile){
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
idir <- chartr("\\", "/", input$dataFileInfo$folder)
ifile<-file.path(idir,input$dataFileInfo$filename)
curdir<-getwd()
#setwd(idir)
#setwd('C:/Apache/htdocs/widget/data/lgr3rqen4vc94otvrmfkncpuv0')
cuff_data <- readCufflinks(idir)

replicates<-replicates(cuff_data)

expinfo<-list()
expinfo[['title']]<-'Test RNA-seq title'
expinfo[['name']]<-'NA'

pdataFileName<- paste(input$dataFileInfo[['filename']],"__pdata_cufDiff.txt", sep="")
ofile<-file.path(idir,pdataFileName)
write.table(replicates,file=ofile,sep = "\t",quote=FALSE) # write replicates info

densImageFileName<- paste(input$dataFileInfo[['filename']],"__dense.png", sep="")
densImagePath<-file.path(idir,densImageFileName)
png(densImagePath, bg="transparent", width=600, height=300)
feature.cuff_data <- genes(cuff_data)
p1<-dispersionPlot(feature.cuff_data)
print(p1)
dev.off() 

# plotting expression boxplot --------------------------------------------------
boxplotFileName<-paste(input$dataFileInfo[['filename']],"__boxplot.png", sep="")
boxplotPath<-file.path(idir,boxplotFileName)
png(boxplotPath, bg="transparent", width=500, height=300)
#p3<-csBoxplot(feature.cuff_data,replicates=T)
#print(p3)
dev.off()

output$status<-"success"
output$expinfo<-expinfo
densData<-list()
densData$densImage<-densImageFileName
densData$boxplot<-boxplotFileName
output$densData <- densData  
dataFileInfo<-list()
dataFileInfo<-input$dataFileInfo
output$dataFileInfo <- dataFileInfo

output<-list(output=output)
outputstr<-toJSON(output)
write(outputstr,"")


