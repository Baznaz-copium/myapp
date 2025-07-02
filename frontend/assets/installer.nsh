; filepath: c:\laragon\www\myapp\frontend\assets\installer.nsh

!macro customWelcomePage
  !insertmacro MUI_HEADER_TEXT "Welcome to PS4 Rental Management Setup" "This wizard will guide you through the installation."
!macroend

!macro customFinishPage
  !insertmacro MUI_HEADER_TEXT "Setup Complete" "PS4 Rental Management has been installed successfully."
!macroend

!macro preInit
  ; Example: Show a message before install starts
  MessageBox MB_ICONINFORMATION|MB_OK "Welcome! The setup will now begin."
!macroend

!macro customInstall
  ; Example: Write an install log file
  Push "$INSTDIR\install.log"
  FileOpen $0 $INSTDIR\install.log w
  FileWrite $0 "PS4 Rental Management installed on $SYSDATE $SYSDIR$\r$\n"
  FileClose $0
!macroend

!macro customUnInstall
  ; Example: Remove the install log file on uninstall
  Delete "$INSTDIR\install.log"
!macroend

; Add a checkbox for desktop shortcut on the finish page
!macro customPageFinish
  !insertmacro MUI_INSTALLOPTIONS_WRITE "ioSpecial.ini" "Field 1" "Text" "Create a desktop shortcut"
  !insertmacro MUI_INSTALLOPTIONS_WRITE "ioSpecial.ini" "Field 1" "Type" "CheckBox"
  !insertmacro MUI_INSTALLOPTIONS_WRITE "ioSpecial.ini" "Field 1" "State" "1"
!macroend

!insertmacro customWelcomePage
!insertmacro customFinishPage
!insertmacro preInit
!insertmacro customInstall
!insertmacro customUnInstall
!insertmacro customPageFinish