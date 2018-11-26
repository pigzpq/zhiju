package com.kingdee.eas.bi.subject.demo;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import com.kingdee.bos.Context;
import com.kingdee.eas.bi.subject.BaseVarProvider;
import com.kingdee.util.db.SQLUtils;

/**
 * 说明: 用户自定义类 主要用于获取上下文的计算值.
 * 
 * 变量的使用方法:
 * 		@变量名   	转换为    带前后缀的值
 * 					前后缀与返回类型对应: 日期: {} 字符串: '' 数值: 无
 *		$变量名	  	转换为		不带前后缀的对应值	 		
 * 		${变量名}$	转换为		不带前后缀的对应值
 * 变量对应的方法名:
 * 		getXXX      (XXX代表变量名,注意需要将首字母大写)
 * 		例如: 变量名: varTest  对应的方法是:  getVarTest()
 * 
 * 注意:
 * 		以下示例变量仅在于演示功能,不具有明确的业务含义.
 * @author Stone 2009/02/25
 */
public class DemoVarProvider extends BaseVarProvider{

	public DemoVarProvider(Context context) {
		super(context);
	}
	
	/**
	 * 返回 距当前10年的日期YYYY-MM-DD
	 * @return
	 */
	public String getTenYear_ago()
	{
		int years = -10;
		Calendar day=Calendar.getInstance();
		day.add(Calendar.YEAR,years);
		SimpleDateFormat sdf=new SimpleDateFormat("yyyy-MM-dd");
		return sdf.format(day.getTime());
		
	}

	/**
	 * 返回 距当前X年的日期YYYY-MM-DD
	 * 	 X 从过滤器宏获取
	 * @return
	 */
	public String getYear_ago()
	{
		int years = 0;
		String strYears = this.getMacroValue("lastYears");
		try {
			years = Integer.parseInt(strYears);
		}catch(NumberFormatException _){
			
		}
		
		Calendar day=Calendar.getInstance();
		day.add(Calendar.YEAR,0-years);
		SimpleDateFormat sdf=new SimpleDateFormat("yyyy-MM-dd");
		return sdf.format(day.getTime());
		
	}
	
	public int getYear2000()
	{
		return 2000;
	}
	
	/**
	 * 通过数据源查找最早的年份. 
	 * 演示如何获取数据库连接.
	 * @return
	 */
	public int getFirstYear()
	{
		int year = 0;
		Connection con = null;
		PreparedStatement ps = null;
		ResultSet rs = null;
		String ksql = "select top 1 YEAR(Month_Date) from t_bi_timeMonth order by Month_Date";
		try {
			con = this.getJDBCConnection();
			ps = con.prepareStatement(ksql);
			rs = ps.executeQuery();
			if(rs.next())
			{
				year = rs.getInt(1);
			}
		} catch (SQLException e) {
			SQLUtils.cleanup(rs,ps,con);
			return year;
		}
		return year;
	}
}
