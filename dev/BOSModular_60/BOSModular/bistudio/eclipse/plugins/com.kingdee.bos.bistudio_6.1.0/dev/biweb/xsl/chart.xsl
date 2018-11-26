<?xml version="1.0"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output method="html" indent="no" encoding="UTF-8"/>

<xsl:template match="chartType">
	json:ChangeChartType{
		show: <xsl:value-of select="@showChangeType"/>,
		type: "<xsl:value-of select="@chartType"/>"
	}json:end
</xsl:template>

<xsl:template match="chart">
	<div type="uicontent">
		<xsl:apply-templates/>
	</div>
</xsl:template>

<xsl:template match="area">
     <xsl:copy>
     	<xsl:apply-templates select="*|@*|node()"/>
     </xsl:copy>
</xsl:template>

<xsl:template match="slicer">
</xsl:template>


<xsl:template match="img">
  <xsl:copy>
    <xsl:apply-templates select="*|@*|node()"/>
  </xsl:copy>
</xsl:template>


<xsl:template match="*|@*|node()">
  <xsl:copy>
    <xsl:apply-templates select="*|@*|node()"/>
  </xsl:copy>
</xsl:template>

</xsl:stylesheet>
