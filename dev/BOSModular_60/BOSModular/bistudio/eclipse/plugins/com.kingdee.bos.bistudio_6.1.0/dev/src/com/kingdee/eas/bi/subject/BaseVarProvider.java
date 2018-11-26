package com.kingdee.eas.bi.subject;
import java.lang.reflect.InvocationTargetException;

import com.kingdee.bos.Context;
import com.kingdee.bos.ctrl.analysis.web.solution.AbstractVarProvider;
import com.kingdee.bos.ctrl.analysis.web.solution.exception.BIReportException;

/**
 * @since V5.4
 * @author zfzheng
 *
 */
public class BaseVarProvider extends AbstractVarProvider{
	
	public BaseVarProvider(Context context){
		super(context);
	}
	
	public Object getVar(String name)throws VarException,BIReportException{
			String methodName="get"+name.substring(0,1).toUpperCase()+name.substring(1);
			try {
				return getClass().getMethod(methodName, null).invoke(this, null);
			} catch (IllegalArgumentException e) {
				throw new VarException("Invoke var "+name+" failed: illegal argument.",e);
			} catch (SecurityException e) {
				throw new VarException("Invoke var "+name+" failed: for security.",e);
			} catch (IllegalAccessException e) {
				throw new VarException("Invoke var "+name+" exception: illegal access.",e);
			} catch (InvocationTargetException e) {
				if(e.getTargetException() instanceof BIReportException)
					throw (BIReportException)e.getTargetException();
				throw new VarException("Invoke var "+name+" exception.",e.getTargetException());
			} catch (NoSuchMethodException e) {
				throw new VarException("Can't find "+methodName+" metod while invoke var "+name+" exception.",e);
			} catch (Exception e) {
				throw new VarException(e);
			}
	}
	
	public String getPublicString()
	{
		return "publicString";
	}
}
