@echo off
SET JAVA_HOME=%~1
SET EAS_HOME=%~2

SET PATH=%JAVA_HOME%\bin;%PATH%

SET DEBUG_OPTIONS=
if "debug" == "%1" SET DEBUG_OPTIONS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=8000

if "%JVM_INITIAL_HEAPSIZE%" == "" SET JVM_INITIAL_HEAPSIZE=64
if "%JVM_MAX_HEAPSIZE%" == "" SET JVM_MAX_HEAPSIZE=256
if "%JVM_MAX_PERMSIZE%" == "" SET JVM_MAX_PERMSIZE=128

echo %EAS_HOME%
SET CLASSPATH=%EAS_HOME%\client\classloader\patch\exetools.jar

set PATH=%JAVA_HOME%\bin;%PATH%
java -Dormrpc.config="%EAS_HOME%\client\deploy\client\ormrpc_client.properties" -Xmx%JVM_MAX_HEAPSIZE%m -Xms%JVM_INITIAL_HEAPSIZE%m -XX:MaxPermSize=%JVM_MAX_PERMSIZE%m %JVM_CUSTOM_PARMS% %DEBUG_OPTIONS% -Dsun.net.client.defaultConnectTimeout=30000 -Dsun.awt.font.advancecache=off -Djava.library.path="%EAS_HOME%\client\deploy\client" -Djava.system.class.loader=com.kingdee.eas.exetools.SystemClassLoader -DEAS_HOME="%EAS_HOME%" -Dmetadata.dir="%EAS_HOME%\client\metas\*.jar;%EAS_HOME%\client\metas\sp\*.jar;%EAS_HOME%\client\metas\patch\*.jar;%EAS_HOME%\client\metas\bos\*.jar;%EAS_HOME%\client\metas\eas\*.jar;%EAS_HOME%\client\metas\mri\*.jar" -Dkingdee.classpath="%EAS_HOME%\client\lib\sp;%EAS_HOME%\client\lib\patch;%EAS_HOME%\client\lib\common\bos;%EAS_HOME%\client\lib\common\eas;%EAS_HOME%\client\lib\common\trd;%EAS_HOME%\client\lib\common\mri;%EAS_HOME%\client\lib\client\bos;%EAS_HOME%\client\lib\client\eas;%EAS_HOME%\client\lib\client\trd;%EAS_HOME%\client\lib\client\mri" com.kingdee.bos.ctrl.extinp.ExtUIRunner -ds %3 -root "%EAS_HOME%\client" -u %4 -p %5 -rpc %6 > a.b
