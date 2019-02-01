let parser = require('../src/');

// parser.parse("https://raw.githubusercontent.com/IT-KiLLER/Sourcemod-plugins/master/Plugins/anticamp/scripting/anticamp.sp", true);

parser.parse("/**\n" +
    " * Anticamp - SourceMod plugin to detect camping players\n" +
    " *\n" +
    " * This program is free software; you can redistribute it and/or\n" +
    " * modify it under the terms of the GNU General Public License\n" +
    " * as published by the Free Software Foundation; either version 2\n" +
    " * of the License, or (at your option) any later version.\n" +
    " *\n" +
    " * This program is distributed in the hope that it will be useful,\n" +
    " * but WITHOUT ANY WARRANTY; without even the implied warranty of\n" +
    " * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.\t See the\n" +
    " * GNU General Public License for more details.\n" +
    " *\n" +
    " * You should have received a copy of the GNU General Public License\n" +
    " * along with this program; if not, write to the Free Software\n" +
    " * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.\n" +
    " */\n" +
    "\n" +
    "#pragma semicolon 1\n" +
    "\n" +
    "#include <sourcemod>\n" +
    "#include <sdktools>\n" +
    "#undef REQUIRE_EXTENSIONS\n" +
    "#include <cstrike>\n" +
    "\n" +
    "#define YELLOW\t\t\t\t \"\x01\"\n" +
    "#define TEAMCOLOR\t\t\t \"\x03\"\n" +
    "#define GREEN\t\t\t\t \"\x04\"\n" +
    "#define PLUGIN_VERSION \"2.5.4\"\n" +
    "#define NON_CAMPER_DELAY 1.0\n" +
    "#define MAX_WEAPONS 49\n" +
    "\n" +
    "// Plugin definitions\n" +
    "public Plugin:myinfo =\n" +
    "{\n" +
    "\tname = \"Anticamp CS:S and CS:GO\",\n" +
    "\tauthor = \"stachi, IT-KiLLER\",\n" +
    "\tdescription = \"Detects camping players\",\n" +
    "\tversion = PLUGIN_VERSION,\n" +
    "\turl = \"https://github.com/IT-KiLLER\"\n" +
    "};\n" +
    "\n" +
    "enum GameType\n" +
    "{\n" +
    "\tGAME_CSS,\n" +
    "\tGAME_CSGO\n" +
    "};\n" +
    "new GameType:g_iGame;\n" +
    "new String:WeaponConfigFile[PLATFORM_MAX_PATH];\n" +
    "new const String:g_sWeaponList[MAX_WEAPONS][13] = {\"glock\",\"usp\",\"p228\",\"deagle\",\"elite\",\"fiveseven\",\"m3\",\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\"xm1014\",\"galil\",\"ak47\",\"scout\",\"sg552\",\"awp\",\"g3sg1\",\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\"famas\",\"m4a1\",\"aug\",\"sg550\",\"mac10\",\"tmp\",\"mp5navy\",\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\"ump45\",\"p90\",\"m249\",\"flashbang\",\"hegrenade\",\"smokegrenade\",\"c4\",\"knife\",\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\"mp7\",\"mp9\",\"bizon\",\"galilar\",\"ssg08\",\"scar20\",\"hkp2000\",\"tec9\",\"negev\",\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\"p250\",\"sg556\",\"sg553\",\"sawedoff\",\"mag7\",\"nova\",\"knifegg\",\"taser\",\"molotov\",\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\"incgrenade\",\"decoy\"\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t};\n" +
    "\n" +
    "new g_iWeaponCampTime[MAX_WEAPONS];\n" +
    "new g_iOffsLastPlaceName = -1;\n" +
    "new g_iOffsEyeAngle = -1;\n" +
    "\n" +
    "new Float:g_fLastPos[MAXPLAYERS + 1][3];\n" +
    "new Float:g_fSpawnEyeAng[MAXPLAYERS + 1][3];\n" +
    "\n" +
    "new g_timerCount[MAXPLAYERS + 1];\n" +
    "\n" +
    "new bool:g_bIsAfk[MAXPLAYERS + 1];\n" +
    "new bool:g_bIsBlind[MAXPLAYERS + 1];\n" +
    "new bool:g_bIsCtMap = false;\n" +
    "new bool:g_bIsTMap = false;\n" +
    "new bool:g_bWeaponCfg = false;\n" +
    "new bool:g_bTeamsHaveAlivePlayers = false;\n" +
    "\n" +
    "new Handle:g_hCampTimerList[MAXPLAYERS + 1];\n" +
    "new Handle:g_hPunishTimerList[MAXPLAYERS + 1];\n" +
    "new Handle:g_hDelayTimerList[MAXPLAYERS + 1];\n" +
    "\n" +
    "new Handle:g_CvarBeacon = INVALID_HANDLE;\n" +
    "new Handle:g_CvarEnable = INVALID_HANDLE;\n" +
    "new Handle:g_CvarSlapSlay = INVALID_HANDLE;\n" +
    "new Handle:g_CvarTakeCash = INVALID_HANDLE;\n" +
    "new Handle:g_CvarBlind = INVALID_HANDLE;\n" +
    "new Handle:g_CvarSlapDmg = INVALID_HANDLE;\n" +
    "new Handle:g_CvarPunishDelay = INVALID_HANDLE;\n" +
    "new Handle:g_CvarPunishFreq = INVALID_HANDLE;\n" +
    "new Handle:g_CvarPunishAnyway = INVALID_HANDLE;\n" +
    "new Handle:g_CvarMinHealth = INVALID_HANDLE;\n" +
    "new Handle:g_CvarMinCash = INVALID_HANDLE;\n" +
    "new Handle:g_CvarRadius = INVALID_HANDLE;\n" +
    "new Handle:g_CvarCampTime = INVALID_HANDLE;\n" +
    "new Handle:g_CvarAllowTCamp = INVALID_HANDLE;\n" +
    "new Handle:g_CvarAllowTCampPlanted = INVALID_HANDLE;\n" +
    "new Handle:g_CvarAllowCtCamp = INVALID_HANDLE;\n" +
    "new Handle:g_CvarAllowCtCampDropped = INVALID_HANDLE;\n" +
    "ConVar sm_anticamp_slap_vel, sm_anticamp_slap_speedmax;\n" +
    "new g_beamSprite;\n" +
    "new g_haloSprite;\n" +
    "new g_MoneyOffset;\n" +
    "\n" +
    "new g_iBRColorT[] = {150, 0, 0, 255};\n" +
    "new g_iBRColorCT[] = {0, 0, 150, 255};\n" +
    "\n" +
    "new UserMsg:g_FadeUserMsgId;\n" +
    "\n" +
    "public OnPluginStart()\n" +
    "{\n" +
    "\tCreateConVar(\"anticamp_css_version\", PLUGIN_VERSION, \"anticamp_css_version\", FCVAR_PLUGIN|FCVAR_NOTIFY|FCVAR_DONTRECORD);\n" +
    "\n" +
    "\tg_CvarEnable = CreateConVar(\"sm_anticamp_enable\", \"1\", \"Set 0 to disable anticamp\", 0, true, 0.0, true, 1.0);\n" +
    "\tg_CvarBeacon = CreateConVar(\"sm_anticamp_beacon\", \"1\", \"Set 0 to disable beacons\", 0, true, 0.0, true, 1.0);\n" +
    "\tg_CvarTakeCash = CreateConVar(\"sm_anticamp_take_cash\", \"0\", \"Amount of money decrease while camping every sm_anticamp_punish_freq. Set 0 to disable\", 0, true, 0.0, true, 16000.0);\n" +
    "\tg_CvarMinCash = CreateConVar(\"sm_anticamp_mincash\", \"0\", \"Minimum money a camper reserves\", 0, true, 0.0, true, 16000.0);\n" +
    "\tg_CvarBlind = CreateConVar(\"sm_anticamp_blind\", \"0\", \"Blind a player while camping\", 0, true, 0.0, true, 1.0);\n" +
    "\tg_CvarSlapSlay = CreateConVar(\"sm_anticamp_slap_mode\", \"1\", \"Set 1 to slap or 2 to slay (kills instantly). Set 0 to disable both\", 0, true, 0.0, true, 2.0);\n" +
    "\tg_CvarSlapDmg = CreateConVar(\"sm_anticamp_slap_dmg\", \"5\", \"Amount of health decrease while camping every sm_anticamp_punish_freq. Ignored for slay\", 0, true, 0.0, true, 100.0);\n" +
    "\tsm_anticamp_slap_vel = CreateConVar(\"sm_anticamp_slap_vel\", \"-250\", \"How strong the push should be.\", 0, true, -500.0, true, 500.0);\n" +
    "\tsm_anticamp_slap_speedmax = CreateConVar(\"sm_anticamp_slap_speedmax\", \"140\", \"The maximum speed otherwise the player becomes slow.\", 0, true, -500.0, true, 500.0);\n" +
    "\tg_CvarMinHealth = CreateConVar(\"sm_anticamp_minhealth\", \"15\", \"Minimum health a camper reserves. Set 0 to slap till dead. If slay set the health from which player will not be killed\", 0, true, 0.0, true, 100.0);\n" +
    "\tg_CvarPunishDelay = CreateConVar(\"sm_anticamp_punish_delay\", \"2\", \"Delay between camper notification and first punishment in secounds\", 0, true, 0.0, true, 60.0);\n" +
    "\tg_CvarPunishFreq = CreateConVar(\"sm_anticamp_punish_freq\", \"2\", \"Time between punishments while camping in secounds\", 0, true, 1.0, true, 60.0);\n" +
    "\tg_CvarPunishAnyway = CreateConVar(\"sm_anticamp_minhealth_camp\", \"1\", \"Set 0 to allow camping below minhealth. Set 1 to punish without damage\", 0, true, 0.0, true, 1.0);\n" +
    "\tg_CvarRadius = CreateConVar(\"sm_anticamp_radius\", \"120\", \"The radius to check for camping\", 0, true, 50.0, true, 500.0);\n" +
    "\tg_CvarCampTime = CreateConVar(\"sm_anticamp_camptime\", \"30\", \"The amount of times a suspected camper is checked for\", 0, true, 2.0, true, 60.0);\n" +
    "\tg_CvarAllowTCamp = CreateConVar(\"sm_anticamp_allow_t_camp\", \"0\", \"Set 1 to allow camping for Ts on cs maps. Set 0 to disable\", 0, true, 0.0, true, 1.0);\n" +
    "\tg_CvarAllowTCampPlanted = CreateConVar(\"sm_anticamp_allow_t_camp_planted\", \"1\", \"Set 1 to allow camping for Ts if bomb planted. Set 0 to disable\", 0, true, 0.0, true, 1.0);\n" +
    "\tg_CvarAllowCtCamp = CreateConVar(\"sm_anticamp_allow_ct_camp\", \"0\", \"Set 1 to allow camping for CTs on de maps. Set 0 to disable\", 0, true, 0.0, true, 1.0);\n" +
    "\tg_CvarAllowCtCampDropped = CreateConVar(\"sm_anticamp_allow_ct_camp_dropped\", \"1\", \"Set 1 to allow camping for CTs if bomb dropped. Is only needed if sm_anticamp_ct_camp is 0\", 0, true, 0.0, true, 1.0);\n" +
    "\n" +
    "\tdecl String:gamedir[PLATFORM_MAX_PATH];\n" +
    "\tGetGameFolderName(gamedir, sizeof(gamedir));\n" +
    "\tif(strcmp(gamedir, \"cstrike\") == 0)\n" +
    "\t{\n" +
    "\t\tg_iGame = GAME_CSS;\n" +
    "\t\tWeaponConfigFile = \"configs/anticamp_css_weapons.cfg\";\n" +
    "\t}\n" +
    "\telse\n" +
    "\t{\n" +
    "\t\tg_iGame = GAME_CSGO;\n" +
    "\t\tWeaponConfigFile = \"configs/anticamp_csgo_weapons.cfg\";\n" +
    "\t}\n" +
    "\n" +
    "\tHookEvent(\"player_spawn\", EventPlayerSpawn, EventHookMode_Post);\n" +
    "\tHookEvent(\"player_death\", EventPlayerDeath, EventHookMode_PostNoCopy);\n" +
    "\tHookEvent(\"bomb_planted\", EventBombPlanted, EventHookMode_PostNoCopy);\n" +
    "\tHookEvent(\"bomb_dropped\", EventBombDropped, EventHookMode_PostNoCopy);\n" +
    "\tHookEvent(\"bomb_pickup\", EventBombPickup, EventHookMode_PostNoCopy);\n" +
    "\tHookEvent(\"round_end\", EventRoundEnd, EventHookMode_PostNoCopy);\n" +
    "\tHookEvent(\"cs_win_panel_match\", EventRoundEnd, EventHookMode_PostNoCopy); // Sometimes round_end did not fire\n" +
    "\tif(g_iGame == GAME_CSGO)\n" +
    "\t{\n" +
    "\t\tHookEvent(\"announce_phase_end\", EventRoundEnd, EventHookMode_PostNoCopy); // Sometimes round_end and cs_win_panel_match did not fire in CS:GO\n" +
    "\t}\n" +
    "\n" +
    "\tg_iOffsEyeAngle = FindSendPropOffs(\"CCSPlayer\",\"m_angEyeAngles[0]\");\n" +
    "\tg_iOffsLastPlaceName = FindSendPropOffs(\"CBasePlayer\", \"m_szLastPlaceName\");\n" +
    "\tg_MoneyOffset = FindSendPropOffs(\"CCSPlayer\", \"m_iAccount\");\n" +
    "\tg_FadeUserMsgId = GetUserMessageId(\"Fade\");\n" +
    "\n" +
    "\tLoadTranslations(\"anticamp.phrases\");\n" +
    "\n" +
    "\t// Auto-generate config file\n" +
    "\t//AutoExecConfig(true,\"plugin.anticamp\",\"sourcemod\");\n" +
    "}\n" +
    "\n" +
    "public OnMapStart()\n" +
    "{\n" +
    "\t// beacon sound\n" +
    "\tPrecacheSound(\"buttons/button17.wav\",true);\n" +
    "\n" +
    "\tif(g_iGame == GAME_CSGO)\n" +
    "\t{\n" +
    "\t\tg_beamSprite = PrecacheModel(\"materials/sprites/laserbeam.vmt\");\n" +
    "\t\tg_haloSprite = PrecacheModel(\"materials/sprites/halo.vmt\");\n" +
    "\t\t// slap sounds\n" +
    "\t\tPrecacheSound(\"player/damage1.wav\",true);\n" +
    "\t\tPrecacheSound(\"player/damage2.wav\",true);\n" +
    "\t\tPrecacheSound(\"player/damage3.wav\",true);\n" +
    "\n" +
    "\t}\n" +
    "\telse\n" +
    "\t{\n" +
    "\t\tg_beamSprite = PrecacheModel(\"materials/sprites/laser.vmt\");\n" +
    "\t\tg_haloSprite = PrecacheModel(\"materials/sprites/halo01.vmt\");\n" +
    "\t}\n" +
    "\n" +
    "\t// Check map class\n" +
    "\tg_bIsCtMap = g_bIsTMap = false;\n" +
    "\tif(FindEntityByClassname(-1, \"func_hostage_rescue\") != -1)\n" +
    "\t\tg_bIsCtMap = true;\n" +
    "\telse if(FindEntityByClassname(-1, \"func_bomb_target\") != -1)\n" +
    "\t\tg_bIsTMap = true;\n" +
    "\n" +
    "\tg_bWeaponCfg = false;\n" +
    "\tParseConfig();\n" +
    "}\n" +
    "\n" +
    "ParseConfig()\n" +
    "{\n" +
    "\tdecl String:PathToConfigFile[PLATFORM_MAX_PATH];\n" +
    "\tBuildPath(Path_SM, PathToConfigFile, sizeof(PathToConfigFile), WeaponConfigFile);\n" +
    "\n" +
    "\tif(!FileExists(PathToConfigFile))\n" +
    "\t\tLogMessage(\"%s not parsed...file doesn't exist! Using sm_anticamp_camptime\", PathToConfigFile);\n" +
    "\telse\n" +
    "\t{\n" +
    "\t\tnew Handle:filehandle = OpenFile(PathToConfigFile, \"r\");\n" +
    "\n" +
    "\t\tdecl String:buffer[32];\n" +
    "\n" +
    "\t\twhile(!IsEndOfFile(filehandle))\n" +
    "\t\t{\n" +
    "\t\t\tReadFileLine(filehandle, buffer, sizeof(buffer));\n" +
    "\t\t\tTrimString(buffer);\n" +
    "\n" +
    "\t\t\tif(buffer[0] == '/' || buffer[0] == '\\0')\n" +
    "\t\t\t\tcontinue;\n" +
    "\n" +
    "\t\t\tfor(new i=0;i<MAX_WEAPONS;i++)\n" +
    "\t\t\t{\n" +
    "\t\t\t\tif(StrContains(buffer, g_sWeaponList[i], false) != -1)\n" +
    "\t\t\t\t{\n" +
    "\t\t\t\t\tReplaceString(buffer, sizeof(buffer), g_sWeaponList[i], \"\");\n" +
    "\t\t\t\t\tReplaceString(buffer, sizeof(buffer), \" \", \"\");\n" +
    "\n" +
    "\t\t\t\t\tif(StringToInt(buffer))\n" +
    "\t\t\t\t\t{\n" +
    "\t\t\t\t\t\tg_bWeaponCfg = true;\n" +
    "\t\t\t\t\t\tg_iWeaponCampTime[i] = StringToInt(buffer);\n" +
    "\t\t\t\t\t}\n" +
    "\t\t\t\t\telse\n" +
    "\t\t\t\t\t\tg_iWeaponCampTime[i] = 0;\n" +
    "\t\t\t\t}\n" +
    "\t\t\t}\n" +
    "\t\t}\n" +
    "\t\tCloseHandle(filehandle);\n" +
    "\t}\n" +
    "}\n" +
    "\n" +
    "GetWeaponCampTime(client)\n" +
    "{\n" +
    "\tif(!g_bWeaponCfg)\n" +
    "\t\treturn GetConVarInt(g_CvarCampTime);\n" +
    "\n" +
    "\t// get weapon name\n" +
    "\tdecl String:weapon[20];\n" +
    "\tGetClientWeapon(client,weapon,20);\n" +
    "\tReplaceString(weapon, 20, \"weapon_\", \"\");\n" +
    "\n" +
    "\tfor(new i=0;i<MAX_WEAPONS;i++)\n" +
    "\t{\n" +
    "\t\tif(StrEqual(g_sWeaponList[i], weapon, false) && g_iWeaponCampTime[i])\n" +
    "\t\t\treturn g_iWeaponCampTime[i];\n" +
    "\t}\n" +
    "\n" +
    "\treturn\tGetConVarInt(g_CvarCampTime);\n" +
    "}\n" +
    "\n" +
    "bool:IsCamping(client)\n" +
    "{\n" +
    "\tnew Float:CurrentPos[3];\n" +
    "\tGetClientAbsOrigin(client, CurrentPos);\n" +
    "\tif(GetVectorDistance(g_fLastPos[client], CurrentPos) < GetConVarInt(g_CvarRadius))\n" +
    "\t{\n" +
    "\t\tif(!g_bIsAfk[client])\n" +
    "\t\t\tif(GetClientHealth(client) > GetConVarInt(g_CvarMinHealth) || GetConVarBool(g_CvarPunishAnyway))\n" +
    "\t\t\t\treturn true;\n" +
    "\t}\n" +
    "\telse if(g_bIsAfk[client])\n" +
    "\t\tg_bIsAfk[client] = false;\n" +
    "\n" +
    "\tg_fLastPos[client] = CurrentPos;\n" +
    "\treturn false;\n" +
    "}\n" +
    "\n" +
    "bool:CheckAliveTeams()\n" +
    "{\n" +
    "\tnew alivect, alivet, team;\n" +
    "\talivect = 0, alivet = 0;\n" +
    "\tfor(new i = 1; i <= MaxClients; i++)\n" +
    "\t{\n" +
    "\t\tif(IsClientInGame(i) && IsPlayerAlive(i))\n" +
    "\t\t{\n" +
    "\t\t\tteam = GetClientTeam(i);\n" +
    "\t\t\tif(team == CS_TEAM_CT)\n" +
    "\t\t\t\talivect++;\n" +
    "\t\t\telse if(team == CS_TEAM_T)\n" +
    "\t\t\t\talivet++;\n" +
    "\t\t}\n" +
    "\t}\n" +
    "\n" +
    "\tif(alivect > 0 || alivet > 0)\n" +
    "\t\treturn true;\n" +
    "\telse\n" +
    "\t\treturn false;\n" +
    "}\n" +
    "\n" +
    "\n" +
    "public Action:EventPlayerDeath(Handle:event,const String:name[],bool:dontBroadcast)\n" +
    "{\n" +
    "\t//Check if anticamp is enabled\n" +
    "\tif(!GetConVarBool(g_CvarEnable))\n" +
    "\t\treturn Plugin_Continue;\n" +
    "\n" +
    "\t// Check if booth Teams have alive players\n" +
    "\tg_bTeamsHaveAlivePlayers = CheckAliveTeams();\n" +
    "\n" +
    "\treturn Plugin_Continue;\n" +
    "}\n" +
    "\n" +
    "public Action:EventBombPickup(Handle:event,const String:name[],bool:dontBroadcast)\n" +
    "{\n" +
    "\t//Check if anticamp is enabled\n" +
    "\tif(!GetConVarBool(g_CvarEnable))\n" +
    "\t\treturn Plugin_Continue;\n" +
    "\n" +
    "\tif(GetConVarBool(g_CvarAllowCtCampDropped) && !GetConVarBool(g_CvarAllowCtCamp))\n" +
    "\t{\n" +
    "\t\tfor(new i = 1; i <= MaxClients; i++)\n" +
    "\t\t{\n" +
    "\t\t\tif(IsClientInGame(i) && IsPlayerAlive(i) && GetClientTeam(i) == CS_TEAM_CT && g_hCampTimerList[i] == INVALID_HANDLE)\n" +
    "\t\t\t{\n" +
    "\t\t\t\tGetClientAbsOrigin(i, g_fLastPos[i]);\n" +
    "\t\t\t\tg_hCampTimerList[i] = CreateTimer(NON_CAMPER_DELAY, CheckCamperTimer, i, TIMER_REPEAT);\n" +
    "\t\t\t}\n" +
    "\t\t}\n" +
    "\t}\n" +
    "\n" +
    "\treturn Plugin_Continue;\n" +
    "}\n" +
    "\n" +
    "public Action:EventBombDropped(Handle:event,const String:name[],bool:dontBroadcast)\n" +
    "{\n" +
    "\t//Check if anticamp is enabled\n" +
    "\tif(!GetConVarBool(g_CvarEnable))\n" +
    "\t\treturn Plugin_Continue;\n" +
    "\n" +
    "\tif(GetConVarBool(g_CvarAllowCtCampDropped) && !GetConVarBool(g_CvarAllowCtCamp))\n" +
    "\t{\n" +
    "\t\tfor(new i = 1; i <= MaxClients; i++)\n" +
    "\t\t{\n" +
    "\t\t\tif(IsClientInGame(i) && g_hCampTimerList[i] != INVALID_HANDLE && GetClientTeam(i) == CS_TEAM_CT)\n" +
    "\t\t\t\tResetTimer(i);\n" +
    "\t\t}\n" +
    "\t}\n" +
    "\n" +
    "\treturn Plugin_Continue;\n" +
    "}\n" +
    "\n" +
    "public Action:EventBombPlanted(Handle:event,const String:name[],bool:dontBroadcast)\n" +
    "{\n" +
    "\t//Check if anticamp is enabled\n" +
    "\tif(!GetConVarBool(g_CvarEnable))\n" +
    "\t\treturn Plugin_Continue;\n" +
    "\n" +
    "\tif(GetConVarBool(g_CvarAllowTCampPlanted))\n" +
    "\t{\n" +
    "\t\tfor(new i = 1; i <= MaxClients; i++)\n" +
    "\t\t{\n" +
    "\t\t\tif(IsClientInGame(i) && g_hCampTimerList[i] != INVALID_HANDLE && GetClientTeam(i) == CS_TEAM_T)\n" +
    "\t\t\t\tResetTimer(i);\n" +
    "\n" +
    "\t\t}\n" +
    "\t}\n" +
    "\n" +
    "\treturn Plugin_Continue;\n" +
    "}\n" +
    "\n" +
    "public Action:EventPlayerSpawn(Handle:event,const String:name[],bool:dontBroadcast)\n" +
    "{\n" +
    "\t//Check if anticamp is enabled\n" +
    "\tif(!GetConVarBool(g_CvarEnable))\n" +
    "\t\treturn Plugin_Continue;\n" +
    "\n" +
    "\t// get the client\n" +
    "\tnew client = GetClientOfUserId(GetEventInt(event, \"userid\"));\n" +
    "\n" +
    "\t// get the client team\n" +
    "\tnew clientteam = GetClientTeam(client);\n" +
    "\n" +
    "\t// return if new client\n" +
    "\tif(clientteam == CS_TEAM_NONE)\n" +
    "\t\treturn Plugin_Continue;\n" +
    "\n" +
    "\t// Check if booth Teams have alive players and safe it\n" +
    "\tg_bTeamsHaveAlivePlayers = CheckAliveTeams();\n" +
    "\n" +
    "\t// reset caught timer\n" +
    "\tg_timerCount[client] = 0;\n" +
    "\n" +
    "\t// reset player eye angle\n" +
    "\tg_fSpawnEyeAng[client][1] = 0.0;\n" +
    "\n" +
    "\t// check to see if there is an outstanding handle from last round\n" +
    "\tResetTimer(client);\n" +
    "\n" +
    "\t// Allow camping for t on cs maps if enabled\n" +
    "\tif(g_bIsCtMap && GetConVarBool(g_CvarAllowTCamp) && clientteam == CS_TEAM_T)\n" +
    "\t\treturn Plugin_Continue;\n" +
    "\n" +
    "\t// Allow camping for ct on de maps if enabled\n" +
    "\tif(g_bIsTMap && GetConVarBool(g_CvarAllowCtCamp) && clientteam == CS_TEAM_CT)\n" +
    "\t\treturn Plugin_Continue;\n" +
    "\t\n" +
    "\t// get the players position and start the timing cycle\n" +
    "\tGetClientAbsOrigin(client, g_fLastPos[client]);\n" +
    "\tg_hCampTimerList[client] = CreateTimer(NON_CAMPER_DELAY, CheckCamperTimer, client, TIMER_REPEAT);\n" +
    "\n" +
    "\treturn Plugin_Continue;\n" +
    "}\n" +
    "\n" +
    "public Action:EventRoundEnd(Handle:event, const String:name[], bool:dontBroadcast)\n" +
    "{\n" +
    "\t//Check if anticamp is enabled\n" +
    "\tif(!GetConVarBool(g_CvarEnable))\n" +
    "\t\treturn Plugin_Continue;\n" +
    "\n" +
    "\t// Check if booth Teams have alive players\n" +
    "\tg_bTeamsHaveAlivePlayers = CheckAliveTeams();\n" +
    "\n" +
    "\tif(g_bTeamsHaveAlivePlayers)\n" +
    "\t{\n" +
    "\t\tfor(new i = 1; i <= MaxClients; i++)\n" +
    "\t\t{\n" +
    "\t\t\tif(IsClientInGame(i) && g_hCampTimerList[i] != INVALID_HANDLE)\n" +
    "\t\t\t{\n" +
    "\t\t\t\tResetTimer(i);\n" +
    "\t\t\t}\n" +
    "\t\t}\n" +
    "\t}\n" +
    "\n" +
    "\treturn Plugin_Continue;\n" +
    "}\n" +
    "\n" +
    "public Action:CheckCamperTimer(Handle:timer, any:client)\n" +
    "{\n" +
    "\t// check to make sure the client is still connected and there are players in both teams\n" +
    "\tif(!g_bTeamsHaveAlivePlayers || !IsClientInGame(client) || !IsPlayerAlive(client))\n" +
    "\t{\n" +
    "\t\tResetTimer(client);\n" +
    "\t\treturn Plugin_Handled;\n" +
    "\t}\n" +
    "\t// store client's eye angle for afk checking\n" +
    "\tif(g_fSpawnEyeAng[client][1] == 0.0)\n" +
    "\t{\n" +
    "\t\tg_bIsAfk[client] = true;\n" +
    "\t\tGetEntDataVector(client, g_iOffsEyeAngle, g_fSpawnEyeAng[client]);\n" +
    "\t}\n" +
    "\telse\n" +
    "\t{\n" +
    "\t\tnew Float:ClientEyeAng[3];\n" +
    "\t\tGetEntDataVector(client, g_iOffsEyeAngle, ClientEyeAng);\n" +
    "\n" +
    "\t\tif(FloatAbs(g_fSpawnEyeAng[client][1] - ClientEyeAng[1]) > 15.0)\n" +
    "\t\t\tg_bIsAfk[client] = false;\n" +
    "\t}\n" +
    "\tif(IsCamping(client))\n" +
    "\t{\n" +
    "\t\t// it looks like this person may be camping, time to get serious\n" +
    "\t\tKillTimer(g_hCampTimerList[client]);\n" +
    "\t\tg_hCampTimerList[client] = CreateTimer(1.0, CaughtCampingTimer, client, TIMER_REPEAT);\n" +
    "\t}\n" +
    "\treturn Plugin_Handled;\n" +
    "}\n" +
    "\n" +
    "public Action:CaughtCampingTimer(Handle:timer, any:client)\n" +
    "{\n" +
    "\t// check to make sure the client is still connected and there are players in both teams\n" +
    "\tif(!g_bTeamsHaveAlivePlayers || !IsClientInGame(client) || !IsPlayerAlive(client))\n" +
    "\t{\n" +
    "\t\tResetTimer(client);\n" +
    "\t\treturn Plugin_Handled;\n" +
    "\t}\n" +
    "\n" +
    "\tif(g_timerCount[client] < GetWeaponCampTime(client))\n" +
    "\t{\n" +
    "\t\tif(IsCamping(client))\n" +
    "\t\t{\n" +
    "\t\t\tg_timerCount[client]++;\n" +
    "\t\t\treturn Plugin_Handled;\n" +
    "\t\t}\n" +
    "\t\telse\n" +
    "\t\t{\n" +
    "\t\t\tResetTimer(client);\n" +
    "\t\t\tg_timerCount[client] = 0;\n" +
    "\n" +
    "\t\t\tg_hCampTimerList[client] = CreateTimer(NON_CAMPER_DELAY, CheckCamperTimer, client, TIMER_REPEAT);\n" +
    "\t\t\treturn Plugin_Handled;\n" +
    "\t\t}\n" +
    "\t}\n" +
    "\telse\n" +
    "\t{\n" +
    "\t\t// get client details\n" +
    "\t\tdecl String:name[32];\n" +
    "\t\tdecl String:camperTeam[18];\n" +
    "\t\tdecl String:camperSteamID[64];\n" +
    "\t\tGetClientName(client, name, sizeof(name));\n" +
    "\t\tGetTeamName(GetClientTeam(client),camperTeam,sizeof(camperTeam));\n" +
    "\t\tGetClientAuthString(client, camperSteamID, sizeof(camperSteamID));\n" +
    "\n" +
    "\t\t// get weapon name\n" +
    "\t\tdecl String:weapon[20];\n" +
    "\t\tGetClientWeapon(client,weapon,20);\n" +
    "\t\tReplaceString(weapon, 20, \"weapon_\", \"\");\n" +
    "\n" +
    "\t\t// get place name\n" +
    "\t\tdecl String:place[24];\n" +
    "\t\tGetEntDataString(client, g_iOffsLastPlaceName, place, sizeof(place));\n" +
    "\n" +
    "\t\tnew bool:Location = StrEqual(place, \"\", false);\n" +
    "\n" +
    "\t\t// log camping\n" +
    "\t\tLogToGame(\"\\\"%s<%d><%s><%s>\\\" triggered \\\"camper\\\"\",name,GetClientUserId(client),camperSteamID,camperTeam);\n" +
    "\n" +
    "\t\t// print to chat\n" +
    "\t\tdecl String:Saytext[192];\n" +
    "\t\tfor(new i=1; i<=MaxClients; i++)\n" +
    "\t\t{\n" +
    "\t\t\tif(IsClientInGame(i) && !IsFakeClient(i))\n" +
    "\t\t\t{\n" +
    "\t\t\t\tFormat(Saytext, sizeof(Saytext), \"\x04[Anticamp]\x01 %T\", \"Player camping\", i, name,weapon,place,YELLOW,TEAMCOLOR,YELLOW,GREEN,YELLOW,GREEN);\n" +
    "\n" +
    "\t\t\t\tif(Location)\n" +
    "\t\t\t\t\tReplaceString(Saytext, 192, \"@\", \"\");\n" +
    "\n" +
    "\t\t\t\tif(GetUserMessageType() == UM_Protobuf) {\n" +
    "\t\t\t\t\tPbSayText2(i, client, true, Saytext, name);\n" +
    "\t\t\t\t}else{\n" +
    "\t\t\t\t\tSayText2(i, client, true, Saytext, name);\n" +
    "\t\t\t\t}\n" +
    "\t\t\t}\n" +
    "\t\t}\n" +
    "\n" +
    "\t\t// reset camp counter\n" +
    "\t\tg_timerCount[client] = 0;\n" +
    "\n" +
    "\t\t// start beacon timer\n" +
    "\t\tif(GetConVarFloat(g_CvarPunishDelay) == GetConVarFloat(g_CvarPunishFreq))\n" +
    "\t\t\tg_hPunishTimerList[client] = CreateTimer(GetConVarFloat(g_CvarPunishDelay), PunishTimer, client, TIMER_REPEAT);\n" +
    "\t\telse if(GetConVarInt(g_CvarPunishDelay) <= 0)\n" +
    "\t\t{\n" +
    "\t\t\tg_hPunishTimerList[client] = CreateTimer(0.1, PunishTimer, client, TIMER_REPEAT);\n" +
    "\t\t\tg_hDelayTimerList[client] = CreateTimer(0.1, PunishDelayTimer, client);\n" +
    "\t\t}\n" +
    "\t\telse\n" +
    "\t\t{\n" +
    "\t\t\tg_hPunishTimerList[client] = CreateTimer(GetConVarFloat(g_CvarPunishDelay), PunishTimer, client, TIMER_REPEAT);\n" +
    "\t\t\tg_hDelayTimerList[client] = CreateTimer(GetConVarFloat(g_CvarPunishDelay), PunishDelayTimer, client);\n" +
    "\t\t}\n" +
    "\n" +
    "\t\t// start camp timer\n" +
    "\t\tKillTimer(g_hCampTimerList[client]);\n" +
    "\t\tg_hCampTimerList[client] = CreateTimer(1.0, CamperTimer, client, TIMER_REPEAT);\n" +
    "\t}\n" +
    "\treturn Plugin_Handled;\n" +
    "}\n" +
    "\n" +
    "public Action:PunishDelayTimer(Handle:timer, any:client)\n" +
    "{\n" +
    "\t// check to make sure the client is still connected and there are players in both teams\n" +
    "\tif(!g_bTeamsHaveAlivePlayers || !IsClientInGame(client) || !IsPlayerAlive(client))\n" +
    "\t{\n" +
    "\t\tResetTimer(client);\n" +
    "\t\treturn Plugin_Handled;\n" +
    "\t}\n" +
    "\n" +
    "\tKillTimer(g_hPunishTimerList[client]);\n" +
    "\tg_hPunishTimerList[client] = CreateTimer(GetConVarFloat(g_CvarPunishFreq), PunishTimer, client, TIMER_REPEAT);\n" +
    "\tg_hDelayTimerList[client] = INVALID_HANDLE;\n" +
    "\n" +
    "\treturn Plugin_Handled;\n" +
    "}\n" +
    "\n" +
    "public Action:CamperTimer(Handle:timer, any:client)\n" +
    "{\n" +
    "\t// check to make sure the client is still connected and there are players in both teams\n" +
    "\tif(!g_bTeamsHaveAlivePlayers || !IsClientInGame(client) || !IsPlayerAlive(client))\n" +
    "\t{\n" +
    "\t\tResetTimer(client);\n" +
    "\t\treturn Plugin_Handled;\n" +
    "\t}\n" +
    "\n" +
    "\t// check if still camping\n" +
    "\tif(!IsCamping(client))\n" +
    "\t{\n" +
    "\t\tResetTimer(client);\n" +
    "\t\tg_hCampTimerList[client] = CreateTimer(NON_CAMPER_DELAY, CheckCamperTimer, client, TIMER_REPEAT);\n" +
    "\t}\n" +
    "\n" +
    "\treturn Plugin_Handled;\n" +
    "}\n" +
    "\n" +
    "public Action:PunishTimer(Handle:timer, any:client)\n" +
    "{\n" +
    "\t// check to make sure the client is still connected and there are players in both teams\n" +
    "\tif(!g_bTeamsHaveAlivePlayers || !IsClientInGame(client) || !IsPlayerAlive(client))\n" +
    "\t{\n" +
    "\t\tResetTimer(client);\n" +
    "\t\treturn Plugin_Handled;\n" +
    "\t}\n" +
    "\n" +
    "\t// create a beam effect and the anathor one immediately after\n" +
    "\tif(GetConVarBool(g_CvarBeacon))\n" +
    "\t{\n" +
    "\t\tnew clientteam = GetClientTeam(client);\n" +
    "\n" +
    "\t\tif(clientteam == CS_TEAM_CT)\n" +
    "\t\t\tBeamRing(client, g_iBRColorCT);\n" +
    "\t\telse if(clientteam == CS_TEAM_T)\n" +
    "\t\t\tBeamRing(client, g_iBRColorT);\n" +
    "\n" +
    "\t\tCreateTimer(0.2, BeaconTimer2, client);\n" +
    "\n" +
    "\t\tnew Float:vecPos[3];\n" +
    "\t\tGetClientAbsOrigin(client, vecPos);\n" +
    "\t\tEmitSoundToAll(\"buttons/button17.wav\", client, SNDCHAN_AUTO, SNDLEVEL_NORMAL, SND_NOFLAGS, 1.0, SNDPITCH_NORMAL, -1, vecPos, NULL_VECTOR, true, 0.0);\n" +
    "\t}\n" +
    "\n" +
    "\tnew ClientHealth = GetClientHealth(client);\n" +
    "\tnew MinHealth = GetConVarInt(g_CvarMinHealth);\n" +
    "\n" +
    "\t// take player cash\n" +
    "\tif(GetConVarInt(g_CvarTakeCash) > 0)\n" +
    "\t{\n" +
    "\t\tif(ClientHealth > MinHealth || GetConVarBool(g_CvarPunishAnyway))\n" +
    "\t\t{\n" +
    "\t\t\tnew ClientCash = GetEntData(client, g_MoneyOffset);\n" +
    "\t\t\tnew MinCash = GetConVarInt(g_CvarMinCash);\n" +
    "\n" +
    "\t\t\tif(ClientCash > MinCash)\n" +
    "\t\t\t{\n" +
    "\t\t\t\tClientCash -= GetConVarInt(g_CvarTakeCash);\n" +
    "\n" +
    "\t\t\t\tif(ClientCash > MinCash)\n" +
    "\t\t\t\t\tSetEntData(client, g_MoneyOffset, ClientCash, 4, true);\n" +
    "\t\t\t\telse\n" +
    "\t\t\t\t\tSetEntData(client, g_MoneyOffset, MinCash, 4, true);\n" +
    "\t\t\t}\n" +
    "\t\t}\n" +
    "\t\telse if(!GetConVarBool(g_CvarPunishAnyway))\n" +
    "\t\t\tResetTimer(client);\n" +
    "\t}\n" +
    "\n" +
    "\tswitch(GetConVarInt(g_CvarSlapSlay))\n" +
    "\t{\n" +
    "\t\tcase 1:\n" +
    "\t\t{\n" +
    "\t\t\t// slap player\n" +
    "\t\t\tnew SlapDmg = GetConVarInt(g_CvarSlapDmg);\n" +
    "\t\t\tfloat pushVel = sm_anticamp_slap_vel.FloatValue;\n" +
    "\n" +
    "\t\t\tif(ClientHealth > MinHealth)\n" +
    "\t\t\t{\n" +
    "\t\t\t\tClientHealth -= SlapDmg;\n" +
    "\t\t\t\tif(ClientHealth > MinHealth || MinHealth <= 0)\n" +
    "\t\t\t\t{\n" +
    "\t\t\t\t\t//SlapPlayer(client, SlapDmg, true);\n" +
    "\t\t\t\t\tSlowDownPlayer(client);\n" +
    "\t\t\t\t\tPushPlayer(client, 0.0, 0.0, pushVel);\n" +
    "\t\t\t\t\tPushPlayer(client, pushVel, 0.0, 0.0);\n" +
    "\t\t\t\t\tSetEntityHealth(client, ClientHealth);\n" +
    "\t\t\t\t\tSlowDownPlayer(client);\n" +
    "\t\t\t\t}\n" +
    "\t\t\t\telse\n" +
    "\t\t\t\t{\n" +
    "\t\t\t\t\tif(!GetConVarBool(g_CvarPunishAnyway))\n" +
    "\t\t\t\t\t\tResetTimer(client);\n" +
    "\n" +
    "\t\t\t\t\tSlowDownPlayer(client);\n" +
    "\t\t\t\t\tPushPlayer(client, 0.0, 0.0, pushVel);\n" +
    "\t\t\t\t\tPushPlayer(client, pushVel, 0.0, 0.0);\n" +
    "\t\t\t\t\tSetEntityHealth(client, MinHealth);\n" +
    "\t\t\t\t\tSlowDownPlayer(client);\n" +
    "\t\t\t\t\t//SlapPlayer(client, 0, true);\n" +
    "\t\t\t\t}\n" +
    "\t\t\t}\n" +
    "\t\t\telse if(GetConVarBool(g_CvarPunishAnyway))\n" +
    "\t\t\t{\n" +
    "\t\t\t\tSlowDownPlayer(client);\n" +
    "\t\t\t\tPushPlayer(client, 0.0, 0.0, pushVel);\n" +
    "\t\t\t\tPushPlayer(client, pushVel, 0.0, 0.0);\n" +
    "\t\t\t\tSlowDownPlayer(client);\n" +
    "\t\t\t}\n" +
    "\t\t}\n" +
    "\t\tcase 2:\n" +
    "\t\t{\n" +
    "\t\t\t// slay player\n" +
    "\t\t\tif(ClientHealth > MinHealth)\n" +
    "\t\t\t\tForcePlayerSuicide(client);\n" +
    "\t\t}\n" +
    "\t}\n" +
    "\n" +
    "\tif(g_iGame == GAME_CSGO)\n" +
    "\t{\n" +
    "\t\tfloat vecPos[3];\n" +
    "\t\tGetClientAbsOrigin(client, vecPos);\n" +
    "\n" +
    "\t\tchar g_slapSound[24];\n" +
    "\t\tFormat(g_slapSound, 64, \"player/damage%i.wav\", GetRandomInt(1, 3));\n" +
    "\t\tEmitSoundToAll(g_slapSound, client, SNDCHAN_AUTO, SNDLEVEL_NORMAL, SND_NOFLAGS, 1.0, SNDPITCH_NORMAL, -1, vecPos, NULL_VECTOR, true, 0.0);\n" +
    "\t}\n" +
    "\n" +
    "\t// blind player\n" +
    "\tif(GetConVarBool(g_CvarBlind) && !IsFakeClient(client) && IsPlayerAlive(client))\n" +
    "\t{\n" +
    "\t\tClientHealth = GetClientHealth(client);\n" +
    "\n" +
    "\t\tif(ClientHealth > MinHealth || GetConVarBool(g_CvarPunishAnyway))\n" +
    "\t\t{\n" +
    "\t\t\tPerformBlind(client, 255);\n" +
    "\t\t\tg_bIsBlind[client] = true;\n" +
    "\t\t}\n" +
    "\t\telse if(!GetConVarBool(g_CvarPunishAnyway))\n" +
    "\t\t\tResetTimer(client);\n" +
    "\t}\n" +
    "\n" +
    "\treturn Plugin_Handled;\n" +
    "}\n" +
    "\n" +
    "stock PushPlayer(int client, float A = 0.0, float B = 0.0, float C = 0.0)\n" +
    "{\n" +
    "\tfloat vecVelo[3];\n" +
    "\tvecVelo[0] = A;\n" +
    "\tvecVelo[1] = B;\n" +
    "\tvecVelo[2] = C;\n" +
    "\tSetEntPropVector(client, Prop_Data, \"m_vecBaseVelocity\", vecVelo);\n" +
    "}\n" +
    "\n" +
    "stock SlowDownPlayer(int client){\n" +
    "\tfloat fAbsVelocity[3];\n" +
    "\tGetEntPropVector(client, Prop_Data, \"m_vecAbsVelocity\", fAbsVelocity);\n" +
    "\tfloat fCurrentSpeed = SquareRoot(Pow(fAbsVelocity[0], 2.0) + Pow(fAbsVelocity[1], 2.0));\n" +
    "\tif(fCurrentSpeed > 0.0)\n" +
    "\t{\n" +
    "\t\tfloat fMax = sm_anticamp_slap_speedmax.FloatValue;\n" +
    "\t\tif(fCurrentSpeed > fMax)\n" +
    "\t\t{\n" +
    "\t\t\tfloat x = fCurrentSpeed / fMax;\n" +
    "\t\t\tfAbsVelocity[0] /= x;\n" +
    "\t\t\tfAbsVelocity[1] /= x;\n" +
    "\t\t\t\n" +
    "\t\t\tTeleportEntity(client, NULL_VECTOR, NULL_VECTOR, fAbsVelocity);\n" +
    "\t\t}\n" +
    "\t}\n" +
    "}\n" +
    "\n" +
    "public Action:BeaconTimer2(Handle:timer, any:client)\n" +
    "{\n" +
    "\t// check to make sure the client is still connected and there are players in both teams\n" +
    "\tif(!g_bTeamsHaveAlivePlayers || !IsClientInGame(client) || !IsPlayerAlive(client))\n" +
    "\t{\n" +
    "\t\tResetTimer(client);\n" +
    "\t\treturn Plugin_Handled;\n" +
    "\t}\n" +
    "\n" +
    "\t// create beamring on client\n" +
    "\tnew clientteam = GetClientTeam(client);\n" +
    "\n" +
    "\tif(clientteam == CS_TEAM_CT)\n" +
    "\t\tBeamRing(client, g_iBRColorCT);\n" +
    "\telse if(clientteam == CS_TEAM_T)\n" +
    "\t\tBeamRing(client, g_iBRColorT);\n" +
    "\n" +
    "\treturn Plugin_Handled;\n" +
    "}\n" +
    "\n" +
    "BeamRing(client, color[4])\n" +
    "{\n" +
    "\tnew Float:vec[3];\n" +
    "\tGetClientAbsOrigin(client, vec);\n" +
    "\n" +
    "\tvec[2] += 10;\n" +
    "\n" +
    "\tTE_SetupBeamRingPoint(vec, 20.0, 440.0, g_beamSprite, g_haloSprite, 0, 10, 0.6, 10.0, 0.5, color, 10, 0);\n" +
    "\tTE_SendToAll();\n" +
    "}\n" +
    "\n" +
    "SayText2(to, from, bool:chat, const String:param1[], const String:param2[])\n" +
    "{\n" +
    "\tnew Handle:hBf = INVALID_HANDLE;\n" +
    "\n" +
    "\thBf = StartMessageOne(\"SayText2\", to);\n" +
    "\n" +
    "\tBfWriteByte(hBf, from);\n" +
    "\tBfWriteByte(hBf, chat);\n" +
    "\tBfWriteString(hBf, param1);\n" +
    "\tBfWriteString(hBf, param2);\n" +
    "\tEndMessage();\n" +
    "}\n" +
    "\n" +
    "stock PbSayText2(client, author = 0, bool:bWantsToChat = false, const String:szFormat[], any:...)\n" +
    "{\n" +
    "\tdecl String:szSendMsg[192];\n" +
    "\tVFormat(szSendMsg, sizeof(szSendMsg), szFormat, 5);\n" +
    "\tStrCat(szSendMsg, sizeof(szSendMsg), \"\\n\");\n" +
    "\n" +
    "\tnew Handle:pb = StartMessageOne(\"SayText2\", client);\n" +
    "\n" +
    "\tif (pb != INVALID_HANDLE) {\n" +
    "\t\tPbSetInt(pb, \"ent_idx\", author);\n" +
    "\t\tPbSetBool(pb, \"chat\", bWantsToChat);\n" +
    "\t\tPbSetString(pb, \"msg_name\", szSendMsg);\n" +
    "\t\tPbAddString(pb, \"params\", \"\");\n" +
    "\t\tPbAddString(pb, \"params\", \"\");\n" +
    "\t\tPbAddString(pb, \"params\", \"\");\n" +
    "\t\tPbAddString(pb, \"params\", \"\");\n" +
    "\t\tEndMessage();\n" +
    "\t}\n" +
    "}\n" +
    "\n" +
    "ResetTimer(client)\n" +
    "{\n" +
    "\tif(g_bIsBlind[client])\n" +
    "\t{\n" +
    "\t\tPerformBlind(client, 0);\n" +
    "\t\tg_bIsBlind[client] = false;\n" +
    "\t}\n" +
    "\n" +
    "\tif(g_hPunishTimerList[client] != INVALID_HANDLE)\n" +
    "\t{\n" +
    "\t\tKillTimer(g_hPunishTimerList[client]);\n" +
    "\t\tg_hPunishTimerList[client] = INVALID_HANDLE;\n" +
    "\t}\n" +
    "\n" +
    "\tif(g_hCampTimerList[client] != INVALID_HANDLE)\n" +
    "\t{\n" +
    "\t\tKillTimer(g_hCampTimerList[client]);\n" +
    "\t\tg_hCampTimerList[client] = INVALID_HANDLE;\n" +
    "\t}\n" +
    "\n" +
    "\tif(g_hDelayTimerList[client] != INVALID_HANDLE)\n" +
    "\t{\n" +
    "\t\tKillTimer(g_hDelayTimerList[client]);\n" +
    "\t\tg_hDelayTimerList[client] = INVALID_HANDLE;\n" +
    "\t}\n" +
    "}\n" +
    "\n" +
    "PerformBlind(target, amount)\n" +
    "{\n" +
    "\tif(IsClientInGame(target))\n" +
    "\t{\n" +
    "\t\tnew targets[2];\n" +
    "\t\ttargets[0] = target;\n" +
    "\t\t\n" +
    "\t\tnew color[4] = { 0, 0, 0, 0 };\n" +
    "\t\tcolor[0] = 0;\n" +
    "\t\tcolor[1] = 0;\n" +
    "\t\tcolor[2] = 0;\n" +
    "\t\tcolor[3] = amount;\n" +
    "\t\t\n" +
    "\t\tnew flags;\n" +
    "\t\tif (amount == 0)\n" +
    "\t\t\tflags = (0x0001 | 0x0010);\n" +
    "\t\telse\n" +
    "\t\t\tflags = (0x0002 | 0x0008);\n" +
    "\n" +
    "\t\tnew Handle:message = StartMessageEx(g_FadeUserMsgId, targets, 1);\n" +
    "\t\t\n" +
    "\t\tif (GetUserMessageType() == UM_Protobuf)\n" +
    "\t\t{\n" +
    "\t\t\tPbSetInt(message, \"duration\", 768);\n" +
    "\t\t\tPbSetInt(message, \"hold_time\", 1536);\n" +
    "\t\t\tPbSetInt(message, \"flags\", flags);\n" +
    "\t\t\tPbSetColor(message, \"clr\", color);\n" +
    "\t\t}\n" +
    "\t\telse\n" +
    "\t\t{\n" +
    "\t\t\tBfWriteShort(message, 768);\n" +
    "\t\t\tBfWriteShort(message, 1536);\n" +
    "\t\t\tBfWriteShort(message, flags);\n" +
    "\t\t\tBfWriteByte(message, color[0]);\n" +
    "\t\t\tBfWriteByte(message, color[1]);\n" +
    "\t\t\tBfWriteByte(message, color[2]);\n" +
    "\t\t\tBfWriteByte(message, color[3]);\n" +
    "\t\t}\n" +
    "\n" +
    "\t\tEndMessage();\n" +
    "\t}\n" +
    "}");
