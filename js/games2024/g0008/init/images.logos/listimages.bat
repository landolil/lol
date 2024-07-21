@echo off
setlocal

:: Define the directory to list files from
set "directory=%~1"

:: Define the output file
set "output=list_of_files.txt"

:: If no directory is specified, use the current directory
if "%directory%"=="" set "directory=%cd%"

:: List all files in the directory and subdirectories, and output to the file
dir "%directory%" /S /B > "%output%"

echo List of files has been saved to %output%
endlocal
