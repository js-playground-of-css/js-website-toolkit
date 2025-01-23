
# Matchs manager - script

## Minify

```bash
uglifyjs src/sport/handball/matchs-manager.js --config-file src/sport/handball/matchs-manager.uglify.json -o src/sport/handball/matchs-manager-1_3_0.min.js --mangle-props reserved=[sortData,buildUI,addTeamMatchList,addGym,addTeamMatch,open,nextMatch,previousNextMatch,hasNextMatch,hasPreviousNextMatch,setGeneratedAt,convertStringToDate,KEY_SENIOR_TEAM,KEY_U9_TEAM,KEY_U11M_TEAM],domprops
```
