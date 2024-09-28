/**
  * JavaScript Component to manage set of matchs !
  * Dependency : jQuery.
  * Author: chris-scientist
  * Version : 1.0.0
  * Description : Permet d'afficher les différents matchs pour l'ensemble des équipes d'un club de handball.
  * Contraite : les équipes doivent toutes être alignés sur la même saison. Par exemple, impossible d'afficher pour une équipe les matchs de la saison 2023/2024 et pour une autre équipe celle de la saison 2024/2025. Ceci car les gymnases sont partagés pour la saison.
 */
class MatchManager {
    constructor(activeCalendarStr, aMatchDb) {
        this._activeCalendarStr = activeCalendarStr;
        this._matchDb = aMatchDb;
    }

    sortData() {
        for(const key of this._activeKeys()) {
            this._matchDb.getTeamMatchList(key).sortAllSet();
        }
    }

    /**
     * S'exécute en 31 ms environ.
     */
    buildUI() {
        for(const key of this._activeKeys()) {
            const teamMatchList = this._matchDb.getTeamMatchList(key);
            const settings = MatchSettingsSwitch.getSettingsFromCode(key);
            //
            // Il y a t'il un prochain match ?
            if(teamMatchList.hasNextMatch()) {
                // Il y a un match à venir alors on vérifie s'il est passé ?
                const nextMatch = teamMatchList.getNextMatch();
                const beginDateOfNextMatch = nextMatch.startDate;
                const endDateOfNextMatch = DateUtils.addHourAndMinuteOfOtherDate(beginDateOfNextMatch, 1, 30);
                if(
                    DateUtils.compareDate(endDateOfNextMatch, Today.date()) === 
                    DateConstants.FLAG_LEFT_DATE_IS_EARLIER_THAN_RIGHT_DATE
                ) {
                    // Si le prochain match est en réalité passé...
                    //
                    // Masquer prochain match...
                    $('#next-match').hide();
                    //
                    // Et masquer Indicateur menu...
                    $(`#${settings.htmlIdMenuFlag}`).hide();
                    //
                    // Mise à jour des données...
                    teamMatchList.nextMatchOver();
                } else {
                    // Si le prochain match est toujours en cours...
                    //
                    // Gestion de l'indicateur menu
                    this._showFlagForNextMatch(settings.htmlIdMenuFlag, beginDateOfNextMatch);
                    //
                    // Si nous sommes sur la page du calendrier
                    if( this._isActiveCalendar(key) ) {
                        this._manageCalendarForNextMatch(nextMatch);
                        this._manageCalendarForSecondNextMatch(teamMatchList);
                    }
                }
            }
            if( this._isActiveCalendar(key) ) {
                if( ! teamMatchList.hasNextMatch() ) {
                    const warnMessage = $('#warning-message');
                    let saisonText = teamMatchList.startYear;
                    if(teamMatchList.startYear != teamMatchList.endYear) {
                        saisonText = `${teamMatchList.startYear}/${teamMatchList.endYear}`;
                    }
                    warnMessage.text(`La saison ${saisonText} est probablement terminée, nous vous invitons à revenir régulièrement et à recharger le site pour vérifier s'il y a ou non de nouvelles rencontres, merci de votre compréhension.`);
                    warnMessage.show();
                }
                if( ! teamMatchList.hasSecondNextMatch() ) {
                    $('#second-next-match').hide();
                }
                (new AllPastMatchUI(teamMatchList.pastMatchSet, this._matchDb)).build();
                this._hideWaitingCalendarMessage();
            }
        }
    }

    _isActiveCalendar(aKey) {
        return this._activeCalendarStr === aKey;
    }

    _activeKeys() {
        return [
            MatchExternalConstants.KEY_SENIOR_TEAM//,
//            MatchExternalConstants.KEY_U9_TEAM,
//            MatchExternalConstants.KEY_U11M_TEAM
        ];
    }

    _showFlagForNextMatch(aHtmlIdMenuFlag, aBeginDateOfNextMatch) {
        const durationObj = DateUtils.computeDurationWithToday(aBeginDateOfNextMatch);
        $(`#${aHtmlIdMenuFlag}`).text(new MenuDateDurationTranslator(durationObj).translate());
        $(`#${aHtmlIdMenuFlag}`).show();
    }

    _manageCalendarForNextMatch(aTeamMatch) {
        //
        // Afficher les élements relatif au prochain match
        $('#next-match-title').show();
        $('#next-match-group').show();
        //
        // Calculer et afficher au fil de l'eau les informations du prochain match
        (new MatchUI(
            aTeamMatch, 
            this._matchDb, 
            '#next-match', 
            MatchConstants.FLAG_IS_NEXT_MATCH
        )).build();
    }

    _manageCalendarForSecondNextMatch(aTeamMatchList) {
        if( aTeamMatchList.hasSecondNextMatch() ) {
            (new MatchUI(
                aTeamMatchList.getSecondNextMatch(), 
                this._matchDb, 
                '#second-next-match', 
                MatchConstants.FLAG_IS_NEXT_MATCH
            )).build();
        }
    }

    _hideWaitingCalendarMessage() {
        $('#waiting-message > button').hide();
        $('#waiting-message').removeAttr('style');
    }
}

class AllPastMatchUI {
    constructor(aPastMatchSet, aMatchDb) {
        this._pastMatchSet = aPastMatchSet;
        this._matchDb = aMatchDb;
    }

    build() {
        if( this._pastMatchSet.length > 0 ) {
            //
            // Afficher les élements relatif aux matchs passés
            $('#past-match-title').show();
            $('#past-match-text').show();
            $('#past-match-group').show();
            //
            // Ajouter les matchs passés à la page
            const idsComputed = this._pastMatchSet.map(function (pastMatch) {
                return (new IdDateTranslator(pastMatch.startDate).translate());
            });
            let itMatch = 0;
            for(const pastMatch of this._pastMatchSet) {
                const htmlId = idsComputed[itMatch];
                (new ClonePastMatchPlaceholderUI(htmlId)).build();
                if(itMatch >= (this._pastMatchSet.length - 1)) {
                    $('#past-match-placeholder').hide();
                }
                (new MatchUI(
                    pastMatch,
                    this._matchDb,
                    `#${htmlId}`,
                    MatchConstants.FLAG_IS_PAST_MATCH
                )).build();
                itMatch++;
            }
        }
    }
}

class ClonePastMatchPlaceholderUI {
    constructor(aMainHtmlId) {
        this._mainHtmlId = aMainHtmlId;
    }

    build() {
        const pastMatchGroup = $('#past-match-group');
        const newPlaceholder = $('#past-match-placeholder').clone();
        newPlaceholder.attr('id', this._mainHtmlId);
        pastMatchGroup.prepend(newPlaceholder);
    }
}

class MatchUI {
    constructor(aTeamMatch, aMatchDb, aMainHtmlId, isNextMatch) {
        this._teamMatch = aTeamMatch;
        this._matchDb = aMatchDb;
        this._mainHtmlId = aMainHtmlId;
        this._isNextMatch = isNextMatch;
        this._teamMatchFull = null;
    }

    build() {
        if(this._isNextMatch) {
            $(this._mainHtmlId).show();
        }
        this._showTeam();
        this._showDurationOrDate();
        this._showFullDateOfMatch();
        this._showGym();
        this._removePlaceholder();
    }

    _showTeam() {
        //
        // Affichage de la ou des équipes adverses
        const htmlTitle = $(`${this._mainHtmlId} > div > h5`);
        htmlTitle.removeClass('placeholder w-50');
        if(this._getTeamMatchFull().teamList.length === 1) {
            htmlTitle.text(`Match contre ${this._getTeamMatchFull().teamList[0].name}`);
        } else {
            // TODO manage few team's name
            htmlTitle.text(`Match contre ${this._getTeamMatchFull().teamList.length} équipes`);
        }
    }

    _showDurationOrDate() {
        //
        // Affichage de la durée ou date
        let output = null;
        const startDate = this._getTeamMatchFull().startDate;
        if( this._isNextMatch ) {
            // Afficher la durée
            output = (new CalendarDateDurationTranslator(
                DateUtils.computeDurationWithToday(startDate))
            ).translate();
        } else {
            // Afficher la date
            output = (new DateWithoutTimeTranslator(startDate)).translate();
        }
        //
        // Remplacer le placeholder par le texte
        if(output !== null) {
            const durationText = $(`${this._mainHtmlId} > div > small`);
            durationText.removeClass('placeholder w-25');
            durationText.text(output);
        }
    }

    _showFullDateOfMatch() {
        //
        // Afficher la date complète de la rencontre
        const textFullDateOrHardText = $(`${this._mainHtmlId} > p`);
        let labelFullDateOrHardText = 'Résultat à retrouver sur nos réseaux !'; // Afficher un texte en dur
        if( this._isNextMatch ) {
            // Afficher la date complète de la rencontre
            labelFullDateOrHardText = new FullDateTranslator(this._getTeamMatchFull().startDate).translate();
        }
        textFullDateOrHardText.removeClass('placeholder w-50');
        textFullDateOrHardText.text(labelFullDateOrHardText);
    }

    _showGym() {
        //
        // Afficher le lieu de la rencontre
        const textGym = $(`${this._mainHtmlId} > small`);
        textGym.removeClass('placeholder w-50');
        textGym.text(`Lieu : ${this._getTeamMatchFull().gymName} à ${this._getTeamMatchFull().gymCity}`);
    }

    _removePlaceholder() {
        //
        // Suppression du placeholder-wave
        $(`${this._mainHtmlId}`).removeClass('placeholder-wave');
    }

    _getTeamMatchFull() {
        if(this._teamMatchFull === null) {
            this._teamMatchFull = TeamMatchFullBuilder.create(this._teamMatch, this._matchDb);
        }
        return this._teamMatchFull;
    }

}

class MatchSettings {
    constructor(anIndexKeyMatchList, aHtmlIdMenuFlag) {
        this._indexKeyMatchList = anIndexKeyMatchList;
        this._htmlIdMenuFlag = aHtmlIdMenuFlag;
    }

    get indexKeyMatchList() {
        return this._indexKeyMatchList;
    }

    get htmlIdMenuFlag() {
        return this._htmlIdMenuFlag;
    }
}

class MatchSettingsBuilder {
    static seniorsSettings() {
        return new MatchSettings(
            0,
            'menu-flag-seniors'
        );
    }

    static u9Settings() {
        return new MatchSettings(
            1,
            'menu-flag-u9'
        );
    }

    static u11MSettings() {
        return new MatchSettings(
            2,
            'menu-flag-u11m'
        );
    }
}

class MatchSettingsSwitch {
    static SENIORS_SETTINGS = MatchSettingsBuilder.seniorsSettings();
    static U9_SETTINGS = MatchSettingsBuilder.u9Settings();
    static U11M_SETTINGS = MatchSettingsBuilder.u11MSettings();

    static getSettingsFromCode(aCode) {
        let settings = null;
        switch(aCode) {
            case "SEN":
                settings = MatchSettingsSwitch.SENIORS_SETTINGS;
                break;
            case "U9":
                settings = MatchSettingsSwitch.U9_SETTINGS;
                break;
            case "U11M":
                settings = MatchSettingsSwitch.U11M_SETTINGS;
                break;
        }
        return settings;
    }
}

class MatchDb {
    constructor() {
        this._matchSet = [];
        this._gymSet = [];
    }

    addTeamMatchList(aKey, aTeamMatchList) {
        const settings = MatchSettingsSwitch.getSettingsFromCode(aKey);
        this._matchSet[settings.indexKeyMatchList] = aTeamMatchList;
    }

    getTeamMatchList(aKey) {
        const settings = MatchSettingsSwitch.getSettingsFromCode(aKey);
        if(settings.indexKeyMatchList in this._matchSet) {
            return this._matchSet[settings.indexKeyMatchList];
        }
        throw new Error("Pas de données pour cet index !!");
    }

    addGym(anIndexKey, aGym) {
        this._gymSet[anIndexKey] = aGym;
    }

    getGym(anIndexKey) {
        if(anIndexKey in this._gymSet) {
            return this._gymSet[anIndexKey];
        }
        throw new Error("Pas de gymnase pour cet index !!");
    }
}

class TeamMatchList {
    constructor() {
        this._futureMatchSet = [];
        this._pastMatchSet = [];
        this._nextMatch = null;
        this._secondNextMatch = null;
        this._nbTryNextMatchOver = 0;
        this._startYear = null;
        this._endYear = null;
    }

    addTeamMatch(aTeamMatch) {
        const endDateOfNextMatch = DateUtils.addHourAndMinuteOfOtherDate(aTeamMatch.startDate, 1, 30);
        if(DateUtils.compareDate(endDateOfNextMatch, Today.date()) === DateConstants.FLAG_LEFT_DATE_IS_EARLIER_THAN_RIGHT_DATE) {
            // La rencontre est passée...
            this._pastMatchSet.push(aTeamMatch);
        } else {
            // La rencontre est en cours ou n'a pas encore eu lieu...
            this._futureMatchSet.push(aTeamMatch);
        }
    }

    sortAllSet() {
        this._futureMatchSet.sort(function (left,right){return left.startDate.getTime() - right.startDate.getTime();});
        this._pastMatchSet.sort(function (left,right){return left.startDate.getTime() - right.startDate.getTime();});
    }

    /**
     * Passe la prochaine rencontre à "l'état terminée".
     * @returns Retourne null en cas d'anomalie, sinon rencontre terminée.
     */
    nextMatchOver() {
        // La prochaine rencontre est terminée...
        //
        if( ! this.hasNextMatch() ) {
            throw new Error("Impossible de supprimer la prochaine rencontre passée car elle n'existe pas !!");
        }
        let matchOver = null;
        try {
            // Supprimer la rencontre qui est terminée
            matchOver = this._futureMatchSet.shift();
            // Ajouter aux rencontres passées
            this._pastMatchSet.unshift(matchOver);
            // Le second prochain match (qu'il existe ou non) devient le prochain match
            // et le second prochain match doit être recalculer (c'est pourquoi il est mis à null) !
            this._nextMatch = this._secondNextMatch;
            this._secondNextMatch = null;
            this._nbTryNextMatchOver = 0;
        } catch(err) {
            this._nbTryNextMatchOver++;
            console.error(`L'erreur suivante s'est produite : ${err}`);
        } finally {
            if(this._nbTryNextMatchOver >= MatchConstants.NB_TRY_NEXT_MATCH_OVER_THROW_ERROR) {
                // Afficher message d'erreur à l'utilisateur
                // Message : La page va être rechargée dans quelques secondes, merci de votre compréhension !

                console.log("La page va être rechargée dans quelques secondes, merci de votre compréhension !");

                // TODO (gérer composant message utilisateur + gérer rechargement) <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
            }
        }
        return matchOver;
    }

    /**
     * Indique s'il y a une prochaine rencontre.
     * @returns Retourne true s'il y a une prochaine rencontre, sinon false.
     */
    hasNextMatch() {
        return this._futureMatchSet.length > 0;
    }

    /**
     * Indique s'il y a une seconde prochaine rencontre.
     * @returns Retourne true s'il y a une seconde prochaine rencontre, sinon false;
     */
    hasSecondNextMatch() {
        return this._futureMatchSet.length > 1;
    }

    /**
     * Récupérer la prochaine rencontre.
     * @returns Retourne la prochaine rencontre ou null.
     */
    getNextMatch() {
        if(this._nextMatch === null && this.hasNextMatch()) {
            this._nextMatch = this._futureMatchSet[0];
        }
        return this._nextMatch;
    }

    /**
     * Récupérer la seconde prochaine rencontre.
     * @returns Retourne la seconde prochaine rencontre ou null.
     */
    getSecondNextMatch() {
        if(this._secondNextMatch === null && this.hasSecondNextMatch()) {
            this._secondNextMatch = this._futureMatchSet[1];
        }
        return this._secondNextMatch;
    }

    get startYear() {
        if( ( ! this.hasNextMatch() ) && this._startYear === null ) {
            this._startYear = this.pastMatchSet[0].startDate.getFullYear();
        }
        return this._startYear;
    }

    get endYear() {
        if( ( ! this.hasNextMatch() ) && this._endYear === null ) {
            this._endYear = this.pastMatchSet[ this.pastMatchSet.length - 1 ].startDate.getFullYear();
        }
        return this._endYear;
    }

    get pastMatchSet() {
        return this._pastMatchSet;
    }
}

class Team {
    constructor(aTeamName) {
        this._name = aTeamName;
    }

    get name() {
        return this._name;
    }
}

class TeamMatch {
    constructor(aStartDate, aGymId, aTeamList) {
        this._startDate = aStartDate;
        this._gymId = aGymId;
        this._teamList = aTeamList;
    }

    get startDate() {
        return this._startDate;
    }

    get gymId() {
        return this._gymId;
    }

    get teamList() {
        return this._teamList;
    }
}

class Gym {
    constructor(aGymName, anAddress, aCity) {
        this._name = aGymName;
        this._address = anAddress;
        this._city = aCity;
    }

    get name() {
        return this._name;
    }

    get address() {
        return this._address;
    }

    get city() {
        return this._city;
    }
}

class TeamMatchFull {
    constructor(aTeamMatch, aGymObj) {
        this._startDate = aTeamMatch.startDate;
        this._teamList = aTeamMatch.teamList;
        this._gym = aGymObj;
    }

    get startDate() {
        return this._startDate;
    }

    get teamList() {
        return this._teamList;
    }

    get gymName() {
        return this._gym.name;
    }

    get gymAddress() {
        return this._gym.address;
    }

    get gymCity() {
        return this._gym.city;
    }
}

class TeamMatchFullBuilder {
    static create(aTeamMatch, aMatchDb) {
        return new TeamMatchFull(aTeamMatch, aMatchDb.getGym(aTeamMatch.gymId));
    }
}

class Today {
    static date() {
        //return new Date(2024,7/* 7 = août */,25);
        return new Date();
    }
}

/**
 * Construit l'ID d'un match (le retour ne comprends pas le dièse).
 */
class IdDateTranslator {
    constructor(aDate) {
        this._date = aDate;
    }

    translate() {
        return `${this._year()}${this._month()}${this._day()}_${this._hour()}${this._minute()}`;
    }

    _day() {
        return this._date.getDate();
    }

    _month() {
        const month = ( this._date.getMonth() + 1);
        let output = month;
        if(month < 10) {
            output = '0';
            output = output.concat(month);
        }
        return output;
    }

    _year() {
        return this._date.getFullYear();
    }

    _hour() {
        return this._date.getHours();
    }

    _minute() {
        const minute = this._date.getMinutes();
        let output = minute;
        if(minute < 10) {
            output = '0';
            output = output.concat(minute);
        }
        return output;
    }
}

class DateWithoutTimeTranslator {
    constructor(aDate) {
        this._date = aDate;
    }

    translate() {
        return `${this._day()}/${this._month()}/${this._year()}`;
    }

    _day() {
        const day = this._date.getDate();
        let output = day;
        if(output < 10) {
            output = '0';
            output = output.concat(day);
        }
        return output;
    }

    _month() {
        const month = ( this._date.getMonth() + 1);
        let output = month;
        if(month < 10) {
            output = '0';
            output = output.concat(month);
        }
        return output;
    }

    _year() {
        return this._date.getFullYear();
    }

}

class FullDateTranslator {
    constructor(aDate) {
        this._date = aDate;
    }

    translate() {
        return `Le ${this._day()} ${this._month()} ${this._year()} à ${this._hour()}h${this._minute()}`;
    }

    _day() {
        return this._date.getDate();
    }

    _month() {
        const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        return months[ this._date.getMonth() ];
    }

    _year() {
        return this._date.getFullYear();
    }

    _hour() {
        return this._date.getHours();
    }

    _minute() {
        const minute = this._date.getMinutes();
        let output = minute;
        if(minute < 10) {
            output = '0';
            output = output.concat(minute);
        }
        return output;
    }
}

class DateDuration {
    constructor(aDurationStr, aDurationUnit) {
        this._durationStr = aDurationStr;
        this._durationUnit = aDurationUnit;
    }

    get label() {
        return this._durationStr;
    }

    get unit() {
        return this._durationUnit;
    }
}

class MenuDateDurationTranslator {
    constructor(aDateDuration) {
        this._dateDuration = aDateDuration;
    }

    translate() {
        let output = this._dateDuration.label;
        if(this._dateDuration.unit === DateConstants.UNIT_DURATION_DAY) {
            output = `J-${output}`;
        } else if(this._dateDuration.unit === DateConstants.UNIT_DURATION_HOUR) {
            output = `H-${output}`;
        } else if(this._dateDuration.unit === DateConstants.UNIT_DURATION_MINUTE) {
            output = `M-${output}`;
        }
        return output;
    }
}

class CalendarDateDurationTranslator {
    constructor(aDateDuration) {
        this._dateDuration = aDateDuration;
    }

    translate() {
        let output = this._dateDuration.label;
        if(this._dateDuration.unit === DateConstants.UNIT_DURATION_DAY) {
            output = `Dans ${output} jour(s)`;
        } else if(this._dateDuration.unit === DateConstants.UNIT_DURATION_HOUR) {
            output = `Dans ${output} heure(s)`;
        } else if(this._dateDuration.unit === DateConstants.UNIT_DURATION_MINUTE) {
            output = `Dans ${output} minute(s)`;
        }
        return output;
    }
}

class DateUtils {
    static convertStringToDate(aStrDate) {
        const strDateArray = aStrDate.split(' ');
        const strDatePartArray = strDateArray[0].split('/');
        const strTimePartArray = strDateArray[1].split(':');
        return new Date(
            parseInt(strDatePartArray[2]), // Année
            parseInt(strDatePartArray[1]) - 1, // Mois
            parseInt(strDatePartArray[0]), // Jour
            parseInt(strTimePartArray[0]), // Heure
            parseInt(strTimePartArray[1])  // Minute
        );
    }

    static compareDate(aLeftDate, aRightDate) {
        const leftTime = aLeftDate.getTime();
        const rightTime = aRightDate.getTime();

        if(leftTime < rightTime) {
            return DateConstants.FLAG_LEFT_DATE_IS_EARLIER_THAN_RIGHT_DATE;
        } else if(leftTime > rightTime) {
            return DateConstants.FLAG_LEFT_DATE_IS_LATER_THAN_RIGHT_DATE;
        } else {
            return DateConstants.FLAG_LEFT_DATE_IS_EQUAL_TO_RIGHT_DATE;
        }
    }

    static computeDurationWithToday(anInputDate) {
        const endDate = DateUtils.addHourAndMinuteOfOtherDate(anInputDate, 1, 30);
        const compareBeginDate = DateUtils.compareDate(anInputDate, Today.date());
    //    const compareEndDate = DateUtils.compareDate(Today.date(), endDate);
        let output = 'ATM'; // La rencontre est en cours...
        let unit = DateConstants.UNIT_DURATION_ATM;
        if(
            ! (
                (
                    compareBeginDate === DateConstants.FLAG_LEFT_DATE_IS_EARLIER_THAN_RIGHT_DATE || 
                    compareBeginDate === DateConstants.FLAG_LEFT_DATE_IS_EQUAL_TO_RIGHT_DATE
                )/* && (
                    compareEndDate === DateConstants.FLAG_LEFT_DATE_IS_LATER_THAN_RIGHT_DATE || 
                    compareEndDate === DateConstants.FLAG_LEFT_DATE_IS_EQUAL_TO_RIGHT_DATE
                )*/
            )
        ) {
            // La rencontre est à venir...
            const durationInMinutes = Math.ceil( (anInputDate.getTime() - Today.date().getTime()) / 60000 );
            const oneDay = 1440;
            const oneHour = 60;
            if(durationInMinutes >= oneDay) {
                // Il y a un jour ou plus avant le début de la rencontre...
                output = Math.ceil(durationInMinutes / oneDay);
                unit = DateConstants.UNIT_DURATION_DAY;
            } else if(durationInMinutes >= oneHour) {
                // Il y a une heure ou plus avant le début de la rencontre...
                output = Math.ceil(durationInMinutes / oneHour);
                unit = DateConstants.UNIT_DURATION_HOUR;
            } else {
                // Il y a une minute ou plus avant le début de la rencontre...
                output = durationInMinutes;
                unit = DateConstants.UNIT_DURATION_MINUTE;
            }
        }
        return new DateDuration(output, unit);
    }

    static addHourAndMinuteOfOtherDate(anInputDate, aDeltaHour, aDeltaMinute) {
        const hour = 3600000;
        const minute = 60000;
        return new Date(
            anInputDate.getTime() + 
            (hour * aDeltaHour) +
            (minute * aDeltaMinute)
        );
    }
}

class MatchExternalConstants {
    static KEY_SENIOR_TEAM = 'SEN';
    static KEY_U9_TEAM = 'U9';
    static KEY_U11M_TEAM = 'U11M';
}

class MatchConstants {
    static INDEX_KEY_SENIOR_TEAM = 0;
    static INDEX_KEY_U9_TEAM = 1;
    static INDEX_KEY_U11M_TEAM = 2;

    static NB_TRY_NEXT_MATCH_OVER_THROW_ERROR = 3;

    static FLAG_IS_NEXT_MATCH = true;
    static FLAG_IS_PAST_MATCH = false;
}

class DateConstants {
    static FLAG_LEFT_DATE_IS_EARLIER_THAN_RIGHT_DATE = -1;
    static FLAG_LEFT_DATE_IS_LATER_THAN_RIGHT_DATE = 1;
    static FLAG_LEFT_DATE_IS_EQUAL_TO_RIGHT_DATE = 0;

    static UNIT_DURATION_ATM = 0;
    static UNIT_DURATION_MINUTE = 1;
    static UNIT_DURATION_HOUR = 2;
    static UNIT_DURATION_DAY = 3;
}

// |======================|
// | Minify Documentation |
// |======================|
//
// DON'T MINIFY THE FOLLOWING CLASS :
// MatchManager, MatchDb, Gym, TeamMatch, Team, TeamMatchList, DateUtils, MatchExternalConstants.
//
// DON'T MINIMFY THE FOLLOWING METHOD :
// - For MatchManager : sortData, buildUI
// - For MatchDb : addTeamMatchList, addGym
// - For TeamMatchList : addTeamMatch
// - For DateUtils : convertStringToDate
// - For MatchExternalConstants : *
