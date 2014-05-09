library(rjson)

runcore<-try(source("inSilicoDB/makeHeatmap_cuffDif_core.R"))
if(class(runcore)=="try-error"){
    output<-list()
    if(exists("input")){
        output$input<-input
    }else{
        output$input<-""
    }
    output$status<-"failure"
    output$message<-geterrmessage()
    output<-list(output=output)
    outputstr<-toJSON(output)
    
}
write(outputstr,"")
