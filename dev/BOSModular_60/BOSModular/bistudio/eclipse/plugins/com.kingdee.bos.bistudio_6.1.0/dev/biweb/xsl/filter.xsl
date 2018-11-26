<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:KD="http://www.kingdee.com/kdcontrol/xsl">

	<xsl:output method="html" indent="no" encoding="Utf-8"/>

	<xsl:param name="context"/>
	<xsl:param name="filter_imgpath" select="'biweb/img/filter'"/>
	<xsl:param name="htc_path" select="'biweb/htc/'"/>
	<xsl:param name="htc_imgpath" select="'biweb/img/htc/'"/>
	<xsl:param name="base_href"/>
	<xsl:param name="pageId"/>
	<xsl:param name="uiid"/>
	<xsl:param name="reportUrl"/>
	<xsl:param name="useRepository"/>
	<xsl:param name="filter_item" select="'filter_item'"/>
	<xsl:param name="item_used" select="'item_used'"/>

	<xsl:template match="Filter">

		<div id="filter_panel_msgdiv_{$uiid}" style="margin:10px 0px"></div>

		<xsl:if test="$useRepository='true'">
			<div class="filter_panel_container">
				<span id="filter_scheme_{$uiid}" name="filter_scheme">
					<xsl:attribute name="filterItems">
						[
							<xsl:for-each select="FilterSchemeItem">
								<xsl:call-template name="FilterScheme">
								</xsl:call-template>
							</xsl:for-each>
						]
					</xsl:attribute>
				</span>
				<span id="filter_permission_{$uiid}"></span>
				<br/>
				<br/>
				<span>
					<a href="javascript:void(0)" onclick="uilayout.doFilterSave('{$uiid}','{$filter_item}','{$item_used}',false)">保存</a>
					<a href="javascript:void(0)" onclick="uilayout.doFilterSave('{$uiid}','{$filter_item}','{$item_used}',true)">另存</a>
					<a href="javascript:void(0)" onclick="uilayout.doFilterDelete('{$uiid}','{$filter_item}','{$item_used}')">删除</a>
				</span>
				<br/>
				<hr/>
			</div>
		</xsl:if>	
		
		<table border="0" cellspacing="0" cellpadding="0" id="filter" width="100%">
			
			<xsl:for-each select="FilterItem">
				<xsl:call-template name="doFilter">
					<xsl:with-param name="formName" select="filterForm"/>
				</xsl:call-template>
			</xsl:for-each>
			<tr><td/><td/><td align="right"><button class="portal_button" onclick="uilayout.doFilterForm('{$uiid}','{$filter_item}','{$item_used}')">查  询</button></td></tr>
			
		</table>
		
	</xsl:template>

	<xsl:template name="FilterScheme">
		,{caption: "<xsl:value-of select="@schemeName"/>", value: "<xsl:value-of select = "@schemeValue"/>"}
	</xsl:template>
	<xsl:template name="doFilter">
		<xsl:param name="formName"/>
			<tr style="padding:5px 0px">
			<td>
			<xsl:if test="@type='input' and @dataType='date'">
				<input id="{$item_used}{position()}" sue="{$item_used}{position()}" type="checkbox">
					<xsl:if test="@required='true'">
						<xsl:attribute name="disabled">
							<xsl:value-of select="'disabled'"/>
						</xsl:attribute>
						<xsl:attribute name="checked">
							<xsl:value-of select="'checked'"/>
						</xsl:attribute>
					</xsl:if>
				</input>
			</xsl:if>
			</td>
			<td style="white-space: nowrap; word-break: keep-all;text-align:right">
				<span class="filter_label"><xsl:value-of select="@caption"/></span>
			</td>
			<td>
				<xsl:if test="@type='input'">
					<xsl:call-template name="buildInput"/>
				</xsl:if>
				<xsl:if test="@type='list'">
					<xsl:call-template name="buildList"/>
				</xsl:if>
				<xsl:if test="@type='sql'">
					<xsl:call-template name="buildSql"/>
				</xsl:if>
			</td>
			</tr>
	</xsl:template>

	<xsl:template name="buildInput">
		<xsl:variable name="pos" select="position()" />
		<xsl:if test="@dataType!='date'">
			<input id="{$filter_item}_{$uiid}_{$pos}" name="{$pos}" title="{@caption}" class="filter_textfield" type="text">
				<xsl:attribute name="value">
					<xsl:choose>
						<xsl:when test="@selectedValue">
							<xsl:value-of select="@selectedValue" />
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="@defaultValue" />
						</xsl:otherwise>
					</xsl:choose>
				</xsl:attribute>
				<xsl:if test="@required='true'">
					<xsl:attribute name="required">
						<xsl:value-of select="@required" />
					</xsl:attribute>				
				</xsl:if>
			</input>
		</xsl:if>
		<xsl:if test="@dataType='date'">
			<div item="FilterDatePicker" id="{$filter_item}_{$uiid}_{$pos}">
			json:FilterDatePicker{
				id            : "<xsl:value-of select='$filter_item'/>_<xsl:value-of select='$uiid'/>_<xsl:value-of select='$pos'/>",
				name          : "<xsl:value-of select='$pos'/>",
				title         : "<xsl:value-of select='@caption' />",
				defaultValue  : "<xsl:value-of select='@defaultValue' />"
				<xsl:if test="@required='true'">
				, required      : true
				</xsl:if>
			}json:end
			</div>
		</xsl:if>
	</xsl:template>
	
	<xsl:template name="buildList">
		<xsl:variable name="pos" select="position()" />
		<div item="FilterSelectableInputBox" id="{$filter_item}_{$uiid}_{$pos}">
		json:FilterSelectableInputBox{
			id              : "<xsl:value-of select='$filter_item'/>_<xsl:value-of select='$uiid'/>_<xsl:value-of select='$pos'/>",
			name            : "<xsl:value-of select='$pos'/>",
			title           : "<xsl:value-of select='@caption' />",
			operator        : "<xsl:value-of select='@operator' />",
			<xsl:if test="@showTree">
			showTree  : true,
			</xsl:if>
			defaultValue    : "<xsl:value-of select='@defaultValue' />",
			<xsl:if test="@defaultCaption">
			defaultCaption  : "<xsl:value-of select='@defaultCaption' />",
			</xsl:if>
			<xsl:if test="@required='true'">
			required        : true,
			</xsl:if>
			items    : [
			<xsl:call-template name="buildListOptions">
				<xsl:with-param name="selectedValue" select="@selectedValue"/>
				<xsl:with-param name="defaultValue" select="@defaultValue"/>
			</xsl:call-template> ]
		}json:end
		</div>
	</xsl:template>
	
	<xsl:template name="buildSql">
		<xsl:call-template name="buildList"/>
	</xsl:template>
	
	<xsl:template name="buildListOptions">
		<xsl:param name="selectedValue"/>
		<xsl:param name="defaultValue"/>
			<xsl:for-each select="ListItem">
				{ caption: "<xsl:value-of select='@caption'/>", value: "<xsl:value-of select='@value'/>"}
				<xsl:if test="position()!=last()">,</xsl:if>
			</xsl:for-each>
	</xsl:template>
	
</xsl:stylesheet>
