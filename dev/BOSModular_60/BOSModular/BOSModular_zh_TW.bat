rem Guess STUDIO_HOME if not defined
if not "%STUDIO_HOME%" == "" goto gotHome
set STUDIO_HOME=%~dp0
if exist "%STUDIO_HOME%Platform\eclipse\eclipse.exe" goto okHome
set STUDIO_HOME=.
:gotHome
if exist "%STUDIO_HOME%Platform\eclipse\eclipse.exe" goto okHome
echo The STUDIO_HOME environment variable is not defined correctly
echo This environment variable is needed to run this program
goto end
 
:okHome
start "bim" /d "%STUDIO_HOME%Platform\eclipse\" eclipse.exe -nl zh_TW -vm "%STUDIO_HOME%jdk\bin\javaw.exe" -product "com.kingdee.bos.bim.product.ide" -vmargs -Xms512M -Xmx768M -XX:NewSize=96M -XX:MaxPermSize=128M -Dosgi.splashPath="file:/%STUDIO_HOME%/bim/eclipse/plugins/com.kingdee.bos.bimintro_6.1.0" 
 
exit

:end
