from bioservices import *
import json
import sys 
import os

def getModelsIdByName(args_decoded,log):
    s = BioModels()
    term = args_decoded["term"]
    res = s.getModelsIdByName(term)
    #print res
    ret = {}
    if not (res is None):
        d = {}
        for m_id in res:
            #print m_id
            try:
                name = s.getModelNameById(m_id)
            except :
                #print "Error: can\'t fetch"
                pass
            else:
                #print name
                d[m_id] = name       
            # print d[m_id]
            
    # print d
        
        ret['status']='ok'
        ret['results']=d
    else:
        ret['status']='failed'
        ret['msg']="No results were found, try using different keywords"
    return ret    


def getModelSBMLById(args_decoded,log):
    s = BioModels()
    term = args_decoded["term"]
    dataDir = args_decoded["dataDir"]
    res = s.getModelSBMLById(term)
    log.write(str(res))
    filename = term + '.xml'
    path = os.path.join( dataDir, filename)  
    f = open(path, 'w')
    f.write(res)
    f.close()
    ret = {}
    if not (res is None):        
        ret['status']='ok'
        #ret['results']=res
        ret['fileName']=filename
    else:
        ret['status']='failed'
        ret['msg']="failed to fetch SBML"
    return ret    

    


def main(argv):
    log = open("fetchFromBioModels.log", 'w')
    log.write(str(argv))
    #print argv
    args = argv[1]
    args_decoded = json.loads (args)
    search_type = args_decoded["type"]
    
    actions = {'getModelsIdByName' : getModelsIdByName,
               'getModelSBMLById' : getModelSBMLById
               }
    ret = actions[search_type](args_decoded,log)
    
    log.write(str(ret))
    log.close()
    print json.dumps(ret)

if __name__ == "__main__":
    main(sys.argv)
