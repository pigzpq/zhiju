@echo off

if not "%STUDIO_HOME%" == "" goto okHome
set STUDIO_HOME=%~dp0
 
:okHome
cd "%STUDIO_HOME%\bosupdate"
start "BOSModular updater" "%STUDIO_HOME%\jre\bin\javaw.exe" -classpath "toolupdate.jar" "com.kingdee.bos.toolupdate.MainWindows" "%STUDIO_HOME%
exit

:end
