library(gplots)
library(rjson)
library(rentrez)

#TRUE#FALSE
.jsonfile<-TRUE
.DEBUG<-FALSE #FALSE
logmsg<-""
pngfile<-""

if(.DEBUG){
  setwd("c:/Apache/htdocs/widgetdev/lib/server/insilico/")  
}
setwd("./inSilicoDB/")  
args<-c("makeTidalInputSettings.txt")

#print(args)

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

input$folder <- chartr("\\", "/", input$folder)

#processinput<-function(input){
#    input<-input$input
output<-list()
output$input<-input
output$status<-"failure"

para<-input$params

idir<-input$folder
#cat(paste("idir - ",idir,"\n"),file=stderr())
#    browser()
if(!file.exists(idir)){
  output$message<-"the input dir does not exist"
  return(output)
}
odir<-input$folder

if(!file.exists(odir)){
  output$message<-"the output dir does not exist"
  return(output)
}

ifile<-file.path(idir,'dataFile.RData')
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

results.total <- load_obj(ifile)
genesNames<-rownames(results.total)

tidalInputFile<- paste(input$filename, "__tidalInputU.txt", sep="")
tidalInputPath<-file.path(idir,tidalInputFile)


#### appending the refseqs to the FC matrix ###############################################
taxon<-input$taxon
if(taxon=="null"){
  output$message<-"Taxon info does not exist"
  return(output)
}


# detectTaxon <- function() {
#   print ("detecting taxon")
#   library(org.Hs.eg.db)       
#   library(org.Mm.eg.db)
#   taxon<-"null"
#   taxons <- c("Hs","Mm")
#   #lib <- taxons[1]
#   for (lib in taxons){
#     from <- eval(parse(text=paste('org.', lib, '.egSYMBOL2EG', sep = "")))
#     to <- eval(parse(text=paste('org.', lib, '.egREFSEQ', sep = "")))
#     symbol2refseqs<-translate(genesNames, from=from, to=to)
#     mRNA <- pickRefSeq(symbol2refseqs, priorities=c("NM","XM"))    
#     if(length(mRNA) > 1000) {
#       taxon<-lib
#       break      
#     }
#   }
#   taxon
# }
# 
lib <- 'null'
switch(taxon, 
       Human={
         library(org.Hs.eg.db)         
         lib<-'Hs'
       },
       Mouse={
         library(org.Mm.eg.db)
         lib<-'Mm'
       }
#        ,
#        null={
#          lib<-detectTaxon()
#        }
)
# 
if(lib == 'null'){
  output$message<-"taxon is not set"  
  output<-list(output=output)
  outputstr<-toJSON(output)
  write(outputstr,"")
  quit()
  return(output)
}


library(AnnotationFuncs)

from <- eval(parse(text=paste('org.', lib, '.egSYMBOL2EG', sep = "")))
to <- eval(parse(text=paste('org.', lib, '.egREFSEQ', sep = "")))
symbol2refseqs<-translate(genesNames, from=from, to=to)
mRNA <- pickRefSeq(symbol2refseqs, priorities=c("NM","XM"))
if(length(mRNA) < 1000) {
  output$message<-"Couldn't annotate data with RefSeq IDs"
  return(output)
}

e.tmp<-results.total
#e.tmp1 <- e.tmp[1:5,]

maxLen <- max(sapply(mRNA, length))
mRNA1 <- lapply(mRNA, function(.ele){
  c(.ele, rep("", maxLen))[1:maxLen]
})
mRNA.table <- do.call(rbind, mRNA1)
colnames <- colnames(mRNA.table, do.NULL = FALSE) 
col.num <- length(colnames)
colnames <- rep("",col.num)
colnames[1] <- "REFSEQ"
colnames(mRNA.table) <- colnames

#x<-cbind(e.tmp1,mRNA.table[match(e.tmp1[,1],mRNA.table[,1]),])
x<-cbind(e.tmp,mRNA.table[match(rownames(e.tmp),rownames(mRNA.table)),])

x<-cbind(rownames(x),x)
colnames <- colnames(x, do.NULL = FALSE) 
colnames[1] <- "SYMBOL"
colnames(x) <- colnames
###--------------------------------------------------------------------------------------

#ofile<-file.path(input$folder,"tidalInput.txt") 
#write.table(x,file=ofile, sep = "\t", quote=FALSE,row.names=FALSE) # write tidal input file

tidalInputU <- x


#------------remove rows with NA
# narows <-  which((apply(x,1,function(r) { any(is.na(r))} )))
# if (length(narows)>0){
#   tidalInputU <- x[-narows,]
# }

#------------remove NA columns
nacolumns <-  which((apply(x,2,function(col) { all(is.na(col))} )))
if (length(nacolumns)>0){
  tidalInputU <- x[,-nacolumns]
}

#------------remove NA columns (another way)
# tidalInputU <- x[! x[,'REFSEQ'] %in% 'NA',] #filter ungroupped

ofile<-file.path(input$folder,tidalInputFile) 
write.table(tidalInputU,file=ofile, sep = "\t", quote=FALSE,row.names=FALSE) # write tidal input file

output$status<-"success"
output$input<-input
output$tidalInputFile <- tidalInputFile

output<-list(output=output)
outputstr<-toJSON(output)
write(outputstr,"")

############## my functions ######################################################
# find.TFs.in.expr.data <- function(){
#   m2refseq <- read.delim("m2refseqData/2_Human (hg19) 2kb around TSS, conserved with mouse (mm9).gmt", header = FALSE)
#   matrices <- c("V$CREBATF_Q6", "V$CREB_Q2_01", "V$CREB_Q3", "V$CREB_Q4_01", "V$CREM_Q6")
#   r <- m2refseq[which(m2refseq[,1]%in%matrices),]
#   refseqs <- r[,-c(1,2)]
#   refseqs.all <- cbind(refseqs[1,],refseqs[2,],refseqs[3,],refseqs[4,],refseqs[5,])
#   refseqs.unique <- unique(refseqs.all)
#   
#   refseqs.unique.vector <- as.matrix(refseqs.unique)
#   #x <- org.Hs.egREFSEQ2EG
#   #xx <- as.list(x[refseqs.unique.vector])
#   
#   refseqs2symbol<-translate(refseqs.unique.vector, from=org.Hs.egREFSEQ2EG, to=org.Hs.egSYMBOL)
#   binding.genes.all <- paste(refseqs2symbol[names(refseqs2symbol)]) 
#   DEs.1h.UP <- emt.results.fg[which(emt.results.fg[,2]==1),]
#   DEs.1h.DOWN <- emt.results.fg[which(emt.results.fg[,2]==-1),]
#   DEs.1h.total <- rbind(DEs.1h.UP,DEs.1h.DOWN)
#   binding.DEs.1h.UP <- DEs.1h.UP[which(rownames(DEs.1h.UP)%in%binding.genes.all),]
#   binding.DEs.1h.DOWN <- DEs.1h.DOWN[which(rownames(DEs.1h.DOWN)%in%binding.genes.all),]
#   binding.DEs.1h.total <- rbind(binding.DEs.1h.UP,binding.DEs.1h.DOWN)  
# }
# 
# 
# find.TFs.in.expr.data <- function(){
#   m2refseq <- read.delim("m2refseqData/2_Human (hg19) 2kb around TSS, conserved with mouse (mm9).gmt", header = FALSE)
#   
#   matrices <- c("V$CREBATF_Q6", "V$CREB_Q2_01", "V$CREB_Q3", "V$CREB_Q4_01", "V$CREM_Q6")
#   for (i in 1:length(matrices)) {
#     r <- m2refseq[which(m2refseq[,1]%in%matrices),]
#     refseqs <- r[,-c(1,2)]
#     refseqs <- as.matrix(refseqs)
#     refseqs2symbol<-translate(refseqs, from=org.Hs.egREFSEQ2EG, to=org.Hs.egSYMBOL)
#     binding.genes.all <- paste(refseqs2symbol[names(refseqs2symbol)]) 
#     DEs.1h.UP <- emt.results.fg[which(emt.results.fg[,2]==1),]
#     DEs.1h.DOWN <- emt.results.fg[which(emt.results.fg[,2]==-1),]
#     DEs.1h.total <- rbind(DEs.1h.UP,DEs.1h.DOWN)
#     binding.DEs.1h.UP <- DEs.1h.UP[which(rownames(DEs.1h.UP)%in%binding.genes.all),]
#     binding.DEs.1h.DOWN <- DEs.1h.DOWN[which(rownames(DEs.1h.DOWN)%in%binding.genes.all),]
#     binding.DEs.1h.total <- rbind(binding.DEs.1h.UP,binding.DEs.1h.DOWN)
#     
#     write.table(binding.DEs.1h.total,file=paste("genesRegulatedBy-",matrices[i],"1h",".txt"),quote=FALSE,sep = "\t") # write tidal input file
#   }
# }
