library(rjson)

runcore<-try(source("inSilicoDB/getDiff_core.R"))
if(class(runcore)=="try-error"){
    #cat("error in try goes to this\n",file=stderr()) 
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
