package com.kingdee.eas.bi.subject;

import java.sql.Connection;
import java.sql.SQLException;

import com.kingdee.bos.BOSException;
import com.kingdee.bos.Context;
import com.kingdee.bos.ctrl.analysis.web.biscript.BaseBIScriptSystemObject;
import com.kingdee.bos.ctrl.analysis.web.solution.BIEasEnv;
import com.kingdee.bos.ctrl.script.miniscript.ScriptContext;
import com.kingdee.bos.framework.ejb.EJBFactory;
import com.kingdee.eas.common.TableManagerFacadeFactory;
import com.kingdee.eas.framework.report.util.DBUtil;
import com.kingdee.eas.framework.report.util.RptRowSet;

public class BIScriptSystemObject extends BaseBIScriptSystemObject{
	public BIScriptSystemObject(Context context, ScriptContext ctx, BIEasEnv easEnv) {
		super(context, ctx, easEnv);
		
	}
	
	public String getTable()throws BOSException{
		String tableName=null;
		if(context==null){
			tableName="BIScript"+System.currentTimeMillis();
		}else{
			TableManagerFacadeFactory.getLocalInstance(context).getTableName("BIScript");
		}
		registTable(tableName);
		return tableName;
	}
	
	public void releaseTable(String tempTableName) throws BOSException,SQLException{
		if(context==null){
			String sql="drop table "+tempTableName;
			Connection con = getConnection(context);
			try {
				DBUtil.execute(sql, con);
			} finally {
				close(con);
			}
		}else{
			TableManagerFacadeFactory.getLocalInstance(context).releaseTableName(tempTableName);
		}
		unRegistTable(tempTableName);
	}
	
	public int executeUpdate(String sql)throws SQLException{
		Connection con = getConnection(context);
		try {
			return DBUtil.executeUpdate(sql, null, con);
		} finally {
			close(con);
		}		
	}
	
	public RptRowSet executeQuery(String sql) throws SQLException {
		Connection con = getConnection(context);
		try {
			return DBUtil.executeQuery(sql, null, 0, -1, con);
		} finally {
			close(con);
		}
	}	

	public int executeSelectInto(String sql)throws SQLException {
		Connection con = getConnection(context);
		try {
			return DBUtil.executeSelectInto(sql, null, con);
		} finally {
			close(con);
		}
	}
	
	public String selectInto(String sql)throws SQLException,BOSException {
		String tableName=getTable();
		sql="select * into "+ tableName+" from ("+sql+") A";
		Connection con=getConnection(context);
		try{
			DBUtil.executeSelectInto(sql, null, con);
		}finally{
			close(con);
		}
		return tableName;
	}	
	
	private Connection getConnection(Context context) throws SQLException {
		if(ctx==null)
			return easEnv.getJdbcConnection();
		else
			return EJBFactory.getConnection(context);
	}
	
	private static void close(Connection con) throws SQLException {
		if (con != null) {
			con.close();
		}
	}	
}
