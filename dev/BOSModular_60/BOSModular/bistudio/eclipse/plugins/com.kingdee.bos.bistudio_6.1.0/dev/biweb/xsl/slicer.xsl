<?xml version="1.0"?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
>

<xsl:output method="html" indent="no" encoding="UTF-8"/>
<xsl:param name="uiid"/>
<xsl:param name="canMoveDimension"/>
<xsl:param name="showRowDimensionInSlicer"/>
<xsl:param name="showColumnDimensionInSlicer"/>

<xsl:variable name="type" select="'slicer'" />


<xsl:template match="slicer">
  <xsl:apply-templates select="member">
	<xsl:with-param name="type" select="'slicer'"/>
  </xsl:apply-templates>
</xsl:template>

<xsl:template match="axis_row">
  <xsl:if test="$showRowDimensionInSlicer='true'">
  	<xsl:apply-templates select="member">
		<xsl:with-param name="type" select="'axis_row'"/>
  	</xsl:apply-templates>
  </xsl:if>
</xsl:template>

<xsl:template match="axis_col">
  <xsl:if test="$showColumnDimensionInSlicer='true'">
  	<xsl:apply-templates select="member">
		<xsl:with-param name="type" select="'axis_col'"/>
  	</xsl:apply-templates>
  </xsl:if>
</xsl:template>

<xsl:template match="member">
  <xsl:param name="type"/>
    json{
	uiid:'<xsl:value-of select="$uiid"/>',
	title:'<xsl:value-of select="@hierarchy.caption"/>',
	uniqueName:'<xsl:value-of select="@hierarchy.uniqueName"/>',
	type:'<xsl:value-of select="$type"/>',
	canMove:'<xsl:value-of select="$canMoveDimension"/>'
	<xsl:if test="$type='slicer'">
		,defaultValue:'<xsl:value-of select="@member.caption"/>'
	</xsl:if>
	}json:end
</xsl:template>

</xsl:stylesheet>
