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
 * ˵��: �û��Զ����� ��Ҫ���ڻ�ȡ�����ĵļ���ֵ.
 * 
 * ������ʹ�÷���:
 * 		@������   	ת��Ϊ    ��ǰ��׺��ֵ
 * 					ǰ��׺�뷵�����Ͷ�Ӧ: ����: {} �ַ���: '' ��ֵ: ��
 *		$������	  	ת��Ϊ		����ǰ��׺�Ķ�Ӧֵ	 		
 * 		${������}$	ת��Ϊ		����ǰ��׺�Ķ�Ӧֵ
 * ������Ӧ�ķ�����:
 * 		getXXX      (XXX���������,ע����Ҫ������ĸ��д)
 * 		����: ������: varTest  ��Ӧ�ķ�����:  getVarTest()
 * 
 * ע��:
 * 		����ʾ��������������ʾ����,��������ȷ��ҵ����.
 * @author Stone 2009/02/25
 */
public class DemoVarProvider extends BaseVarProvider{

	public DemoVarProvider(Context context) {
		super(context);
	}
	
	/**
	 * ���� �൱ǰ10�������YYYY-MM-DD
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
	 * ���� �൱ǰX�������YYYY-MM-DD
	 * 	 X �ӹ��������ȡ
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
	 * ͨ������Դ������������. 
	 * ��ʾ��λ�ȡ���ݿ�����.
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
