
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output omit-xml-declaration="yes" />


    <xsl:template match="experiment">
        <h3>
            <a href="#">Experiment 
                <xsl:value-of select="title"/>
            </a>
        </h3>     
        <div>
            <div class="expItem">
                <p>
                Experiment general info: 
                </p>

                <div>                        
                    <table border="1">
                        <tr>
                            <td>
                        Experiment ID
                            </td>
                            <td>
                                <xsl:value-of select="id"/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                        Experiment Title
                            </td>
                            <td>
                                <xsl:value-of select="title"/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                        Experiment Type
                            </td>
                            <td>
                                <xsl:value-of select="type"/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                        Author
                            </td>
                            <td>
                                <xsl:value-of select="author"/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                        Created on
                            </td>
                            <td>
                                <xsl:value-of select="date"/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                        Master Experiment
                            </td>
                            <td>
                                <xsl:value-of select="master"/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                        Project
                            </td>
                            <td>
                                <xsl:value-of select="project"/>
                            </td>
                        </tr>
                    </table>
                </div>            
            </div>
            <div class="expItem">
                <p>
		 Experiment description: 
                </p>
                <div>             
                    <xsl:value-of select="description"/>
                </div>            
            </div>            
            <div class="expItem">
                <p>
		 Data files: 
                </p>                 
                <ul>
                    <xsl:for-each select="datafiles/file">
                        <xsl:if test="@filetype = 'data'">
                            <li>
                                <xsl:element name="a">
                                    <xsl:attribute name="href"> 
                                        <xsl:value-of select="@href" /> 
                                    </xsl:attribute> 
                                    <xsl:attribute name="class">confirm 
                                    </xsl:attribute>                                 
                                    <xsl:value-of select="." />
                                </xsl:element>
                            </li>
                        </xsl:if>
                    </xsl:for-each>
                </ul>
            </div>
            <div class="expItem">
                <p>
		 Results: 
                </p>
                <div>
                    <xsl:for-each select="results/section">
                        <div class="resItem">
                            <p>Tool:
                                <xsl:value-of select="tool" /> 
                            </p>
                            <p>Notes:
                                <xsl:value-of select="notes" /> 
                            </p>
                            Files: 
                            <ul>
                                <xsl:for-each select="files/resultFile">
                                    <xsl:if test="@filetype = 'result'"> 
                                        <li>
                                            <xsl:element name="a">
                                                <xsl:attribute name="href"> 
                                                    <xsl:value-of select="@href" /> 
                                                </xsl:attribute> 
                                                <xsl:attribute name="target">_blank
                                                </xsl:attribute>                                             
                                                <xsl:attribute name="class">previewResFile
                                                </xsl:attribute> 
                                                <xsl:value-of select="." />                                                                            
                                            </xsl:element>
                                        </li>
                                    </xsl:if>  
                                </xsl:for-each>
                            </ul>
                        </div>
                    </xsl:for-each>
                </div>
            </div>

  
        </div>  
    </xsl:template>


</xsl:stylesheet>

