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
rd /s /q %STUDIO_HOME%platform\eclipse\configuration\org.eclipse.core.runtime
rd /s /q %STUDIO_HOME%platform\eclipse\configuration\org.eclipse.osgi
rd /s /q %STUDIO_HOME%platform\eclipse\configuration\org.eclipse.update
rd /s /q %STUDIO_HOME%platform\eclipse\configuration\org.eclipse.equinox.source
rd /s /q %STUDIO_HOME%platform\eclipse\configuration\org.eclipse.equinox.app
del /s /q %STUDIO_HOME%platform\eclipse\configuration\.settings\org.eclipse.equinox.p2.metadata.repository.prefs
del /s /q %STUDIO_HOME%platform\eclipse\configuration\.settings\org.eclipse.equinox.p2.artifact.repository.prefs

echo complete reset environment!
echo. & pause 

:end