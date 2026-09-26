; Inno Setup Script for Etsuko Standalone Music Engine
; Creates a professional Windows Setup Installer without requiring admin rights

#define MyAppName "Etsuko"
#define MyAppVersion "69.2"
#define MyAppPublisher "Etsuko Neural Audio"
#define MyAppExeName "etsuko.exe"

[Setup]
AppId={{9F82A4C1-3A2B-4F88-88E2-1A2D99E10B68}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\Programs\{#MyAppName}
DisableProgramGroupPage=yes
DefaultGroupName={#MyAppName}
PrivilegesRequired=lowest
OutputDir=dist
OutputBaseFilename=Etsuko_Setup
SetupIconFile=etsuko.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\{#MyAppExeName}
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "etsuko.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\etsuko.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\etsuko.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait

[Code]
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
begin
  // Terminate any running etsuko.exe instances before copying files so DeleteFile never fails with Error 5
  Exec('taskkill.exe', '/F /IM etsuko.exe /T', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := True;
end;

function InitializeUninstall(): Boolean;
var
  ResultCode: Integer;
begin
  Exec('taskkill.exe', '/F /IM etsuko.exe /T', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := True;
end;
