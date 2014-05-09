# 
#  @package Data Import Widget
#  @author German Nudelman
#
#  This file returns cuffdif results
# 

library(rjson)
#library(RJSONIO)
library(cummeRbund)


# my functions -------------------------------------------------------------------
get_sig_genes_diff_data <- function(cuff_data, L1, L2){
  genes_diff_data <- diffData(genes(cuff_data), L1, L2)
  sig_genes_data <- subset(genes_diff_data, (significant == 'yes'))
  return(sig_genes_data)
}


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
args<-c("getDiff_cuffDif_Settings.txt")
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

.pardefault <- par() 

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
idir <- chartr("\\", "/", input$dataFileInfo$folder)

ifile<-file.path(idir,input$dataFileInfo$filename)

cuff_data <- readCufflinks(idir)
#replicates<-replicates(cuff_data)

csvFileName<- paste(input$dataFileInfo[['filename']],"__csv_text_cuffDif.txt", sep="")
pDatafile<-file.path(idir,csvFileName)
pDataU <- read.table(pDatafile, header = TRUE, sep = "\t", row.names = 'row.names')

# processing input data ------------------------
pDataU <- pDataU[pDataU$Group.Name != 'TBD',] #filter ungroupped

labels.original <- pDataU[,'Group.Name']
labels.original.unique <- unique(labels.original)
orig.contrasts.labels <- paste(labels.original.unique[2:length(labels.original.unique)], labels.original.unique[1], sep="-")


print_diff_data <- function(pair){  
  DEGfiles<-list()
  label<-pair
  pair<-unlist(strsplit(pair,'-'))
  cat(paste('compare:',label,'\n'))
  
  level<-'genes'
  #  level<-'isoforms'
  #  level<-'TSS'
  #  level<-'CDS'
  cat(paste('level',level,'\n'))
  alpha<-0.05
  cat(paste('alpha',alpha,'\n'))

  switch(level,
         genes={sig_genes_data_total <- get_sig_genes_diff_data(cuff_data, pair[1],pair[2]) 
                # could use directly mySigGeneIds<-getSig(cuff_data,pair[1],pair[2],alpha=0.05,level=level)
                nrow(sig_genes_data_total)
                sig_genes_data_total<-na.omit(sig_genes_data_total)
                mySigFeatures<-getGenes(cuff_data,sig_genes_data_total$gene_id)
         },
         isoforms={sig_genes_data_total <- get_sig_isoforms_diff_data(cuff_data, pair[1],pair[2])
         },
         TSS={sig_genes_data_total <- get_sig_TSS_diff_data(cuff_data, pair[1],pair[2])
         },
         CDS={sig_genes_data_total <- get_sig_cds_diff_data(cuff_data, pair[1],pair[2])
         },       
         stop("Enter something that switches me!")
  )
  
  gene_short_names_total<-featureNames(mySigFeatures)
    
  # output total signif results with gene symbols ---------------------------
  merged<-merge(sig_genes_data_total, gene_short_names_total, by.x = "gene_id", by.y = "tracking_id")
  sorted.merged <- merged[with(merged, order(log2_fold_change)), ]
  genes.fc.file<- paste(input$dataFileInfo[['filename']],"__DEgenesFoldChange.txt", sep="")
  genes.fc.file.Path<-file.path(idir,genes.fc.file)
  write.table(sorted.merged, file = genes.fc.file.Path, quote=F, sep='\t', row.names=T, col.names=NA)
  DEGfiles[['FC']] <- genes.fc.file.Path 
    
  regulation<-'DOWN'
  regulations<-c('DOWN','UP')
  for (regulation in regulations){
    cat (paste(" ", regulation," "))
    if(regulation=='UP'){
      sig_genes_data <- subset(sorted.merged, log2_fold_change > 0)
      sig_genes_data<-na.omit(sig_genes_data)
      nrows<-nrow(sig_genes_data)
      cat(paste('nrows sig_genes_data: ',nrows,"\t"))          
      genes.up.file<- paste(input$dataFileInfo[['filename']],"__DEgenesUP.txt", sep="")
      genes.up.file.Path<-file.path(idir,genes.up.file)
      fileConn<-file(genes.up.file.Path)
      writeLines(as.vector(sig_genes_data[,'gene_short_name']), fileConn)
      close(fileConn)
      DEGfiles[['UP']] <- genes.up.file.Path 
      up<-c(nrows)      
    } else{
      sig_genes_data <- subset(sorted.merged, log2_fold_change < 0)
      sig_genes_data<-na.omit(sig_genes_data)
      nrows<-nrow(sig_genes_data)
      cat(paste('nrows sig_genes_data: ',nrows,"\t"))    
      genes.up.file<- paste(input$dataFileInfo[['filename']],"__DEgenesDOWN.txt", sep="")
      genes.up.file.Path<-file.path(idir,genes.up.file)
      fileConn<-file(genes.up.file.Path)
      writeLines(as.vector(sig_genes_data[,'gene_short_name']), fileConn)
      close(fileConn)
      DEGfiles[['DOWN']] <- genes.up.file.Path 
      down<-c(nrows)            
    }
    
  }  
  files<-c(DEGfiles[['FC']], DEGfiles[['UP']], DEGfiles[['DOWN']])
  zip.file<- paste(input$dataFileInfo[['filename']],"__DEgenes.zip", sep="")
  zip.file.Path<-file.path(idir,zip.file)  
  zip(zip.file.Path, DEGfiles, flags = "-r9X", extras = "", zip = Sys.getenv("R_ZIPCMD", "zip"))
  
  
  total <- rbind(up,down)  
}

total<-sapply(orig.contrasts.labels, print_diff_data)
rownames(total)<-c('up','down')

barplotImage<- paste(input$dataFileInfo[['filename']],"__DEnumber.png", sep="")
densImagePath<-file.path(idir,barplotImage)
printbarplot(total, file=TRUE, filename=densImagePath)

sum<- apply(total,2,sum)
if(sum>0){
  output$status<-"success"
  output$msg<-"DE analysis looks ok"
  geneData<-list()  
  geneData$barplot<-barplotImage
  #geneData$fc.file<-fc.file
  zip.file<- paste(input$dataFileInfo[['filename']],"__DEgenes.zip", sep="")
  geneData$DEGzip<-zip.file
  #geneData$filename<-dataFile
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