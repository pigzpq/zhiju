<?xml version="1.0"?>


<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="html" indent="no" encoding="UTF-8"/>

<xsl:param name="context"/>
<xsl:param name="token"/>
<xsl:param name="imgpath" select="'biweb/img/worksheet'"/>
<xsl:param name="controlimg" select="'control'"/>
<xsl:param name="uiid"/>
<xsl:param name="startRow" select="0" />
<xsl:param name="endRow" select="40" />

<xsl:param name="maxHeaderLen" select="20"/>

<xsl:template match="worksheet">
	<div type="uicontent">
		<table width="400" border="1" cellspacing="0" cellpadding="2" bordercolor="#B5B5B5" bordercolordark="#E2E8ED" oncontextmenu="return false;">
			<xsl:apply-templates select="head"/>
			<xsl:apply-templates select="body"/>
		</table>
	</div>
</xsl:template>

<xsl:template match="head | body">
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="row">
	<tr id="{$uiid}_row_{@rowNum}">
  		<xsl:call-template name = "rowNumCol"/>
		<xsl:apply-templates/>
	</tr>
</xsl:template>

<xsl:template name = "rowNumCol">
	<xsl:choose>
		<xsl:when test = "row-heading-heading">
			<th class="rownum-heading">
			<xsl:text>&#160;</xsl:text>
			</th>
		</xsl:when>
		<xsl:when test = "row-heading">
			<th class="rownum">
			<xsl:value-of select="@rowNum"/>
			</th>
		</xsl:when>
		<xsl:otherwise>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="corner">
  <th nowrap="nowrap" class="corner-heading" colspan="{@colspan+1}" rowspan="{@rowspan}">
    <xsl:apply-templates/>
    <!-- &#160; == &nbsp; -->
    <xsl:text>&#160;</xsl:text>
  </th>
</xsl:template>

<xsl:template match="column-heading[@indent]">
  <th class="column-heading-{@style}" colspan="{@colspan}" rowspan="{@rowspan}">
    <xsl:call-template name="nowrap"/>
    <!-- <div style="margin-top: {@indent}em"> -->
      <xsl:apply-templates/>
    <!-- </div> -->
  </th>
</xsl:template>


<xsl:template match="row-heading[@indent]">
  <th class="row-heading-{@style}" colspan="{@colspan}" rowspan="{@rowspan}">
    <xsl:call-template name="nowrap"/>
    <div style="margin-left: {@indent}em">
      <xsl:apply-templates/>
    </div>
  </th>
</xsl:template>


<xsl:template match="column-heading">
  <th class="column-heading-{@style}" colspan="{@colspan}" rowspan="{@rowspan}">
    <xsl:call-template name="nowrap"/>
    <xsl:apply-templates/>
  </th>
</xsl:template>


<xsl:template match="row-heading">
  <th class="row-heading-{@style}" colspan="{@colspan}" rowspan="{@rowspan}">
    <xsl:call-template name="nowrap"/>
    <xsl:apply-templates/>
  </th>
</xsl:template>


<xsl:template match="row-heading-heading">  
  <th class="row-heading-heading" colspan="{@colspan}" rowspan="{@rowspan}" style="color: #1549B3">
	    <xsl:attribute name="uniqueName">
    		<xsl:value-of select="uniqueName/@uniqueName"/>
    	</xsl:attribute>
	    <xsl:call-template name="nowrap"/>
    	<xsl:apply-templates select="caption"/>
  </th>  
</xsl:template>


<xsl:template match="column-heading-heading">

  <th class="column-heading-heading" colspan="{@colspan}" rowspan="{@rowspan}" style="color: #008203">
    	<xsl:attribute name="uniqueName">
    		<xsl:value-of select="uniqueName/@uniqueName"/>
    	</xsl:attribute>
    	<xsl:call-template name="nowrap"/>
      	<xsl:apply-templates select="caption"/>
  </th>
</xsl:template>

<xsl:template match="caption">
  <xsl:call-template name="render-label">
    <xsl:with-param name="label">
      <xsl:value-of select="@caption"/>
    </xsl:with-param>
  </xsl:call-template>
</xsl:template>


<!-- navigation: expand / collapse / leaf node -->
<!-- 
<xsl:template match="drill-expand | drill-collapse">
  <input type="image" onclick="javascript:uilayout.doWorksheetExpand('{$uiid}','{@id}');" id="{@id}" name="{@id}" src="{$context}/{$imgpath}/{@img}.gif" border="0" width="9" height="9"/>
</xsl:template> -->


<xsl:template match="drill-other">
<!--  <img src="{$context}/{$imgpath}/{@img}.gif" border="0" width="9" height="9"/> -->
</xsl:template>


<!-- navigation: sort -->
<!-- <xsl:template match="sort">
  <input name="{@id}" title="{@title}" type="image" src="{$context}/{$imgpath}/{@mode}.gif" border="0" width="9" height="9"/>
</xsl:template> -->

<!-- <xsl:template match="drill-through">
  <input name="{@id}" title="{@title}" type="image" src="{$context}/{$imgpath}/drill-through.gif" border="0" width="9" height="9"/>
</xsl:template>  -->


<xsl:template match="cell">
  <td class="cell-{@style}" style="white-space:no-wrap;word-break:keep-all">
    <xsl:attribute name="style">
    	<xsl:choose>
    		<xsl:when test="@fore_color">
    			<xsl:value-of select="concat(concat('color:',@fore_color),';')"/>
       		</xsl:when>
    	</xsl:choose>
    	<xsl:choose>
    		<xsl:when test="@bg_color">
    			<xsl:value-of select="concat('background-color:',@bg_color)"/>
    		</xsl:when>
    	</xsl:choose>
    </xsl:attribute>
    <xsl:apply-templates select="drill-through"/>
    <xsl:call-template name="render-label">
      <xsl:with-param name="label">
        <xsl:value-of select="@value"/>
      </xsl:with-param>
    </xsl:call-template>
    <xsl:choose>
    		<xsl:when test="@status">
    			<img src="{$context}/{$imgpath}/status{@status}.gif" style="border:none;width:12px;height:12px;"/>
       		</xsl:when>
    </xsl:choose>
    <xsl:choose>
    		<xsl:when test="@trend">
    			<img src="{$context}/{$imgpath}/trend{@trend}.gif" style="border:none;width:12px;height:12px;"/>
       		</xsl:when>
    </xsl:choose>
  </td>
</xsl:template>


<xsl:template name="render-label">
  <xsl:param name="label"/>
  <xsl:choose>
    <!-- clickable member -->
    <xsl:when test="@href">
      <a>
        <xsl:call-template name="make-href">
          <xsl:with-param name="href" select="@href"/>
        </xsl:call-template>
        <xsl:value-of select="$label"/>
        <xsl:apply-templates select="property"/>
      </a>
    </xsl:when>

    <!-- member property -->
    <xsl:when test="property[@name='link']">
      <!--
        target="_blank" was removed because it makes no sense: you have no chance to close
        the new window if the url points to the current context because of the wcf:token
        mechanism
      -->
      <a>
        <xsl:call-template name="make-href">
          <xsl:with-param name="href" select="property[@name='link']/@value"/>
        </xsl:call-template>
        <xsl:value-of select="$label"/>
        <xsl:apply-templates select="property"/>
      </a>
    </xsl:when>
    
    <!-- worksheet heading -->
    <xsl:when test="@worksheet_heading_id">
    	<font id="{@worksheet_heading_id}" uniqueName="{@uniqueName}">
    		<xsl:value-of select="$label"/>
       		<xsl:apply-templates select="property"/>
    	</font>
    </xsl:when>
    
    <!-- default -->
    <xsl:otherwise>
      <xsl:value-of select="$label"/>
      <xsl:apply-templates select="property"/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>


<xsl:template name="make-href">
  <xsl:param name="href"/>
  <xsl:choose>
    <xsl:when test="starts-with($href, '/')">
      <xsl:attribute name="href">
        <xsl:value-of select="concat($context, $href)"/>
      </xsl:attribute>
    </xsl:when>
    <xsl:otherwise>
      <xsl:attribute name="href">
        <xsl:value-of select="$href"/>
      </xsl:attribute>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>



<xsl:template name="nowrap">
  <xsl:choose>
  	<xsl:when test="string-length(string(caption/@caption))&lt;$maxHeaderLen">
    	<xsl:attribute name="nowrap">nowrap</xsl:attribute>
  	</xsl:when>
  	<xsl:otherwise>
  		<xsl:attribute name="style">word-break:break-all;width:200px;</xsl:attribute>
  	</xsl:otherwise>
  </xsl:choose>
  
</xsl:template>


<xsl:template match="property"/>


<xsl:template match="*|@*|node()">
  <xsl:copy>
    <xsl:apply-templates select="*|@*|node()"/>
  </xsl:copy>
</xsl:template>

</xsl:stylesheet>
