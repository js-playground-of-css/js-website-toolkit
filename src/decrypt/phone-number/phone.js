/**
  * JavaScript Component to decrypt phone number !
  * Dependency : jQuery.
  * Version : 1.1.0
 */
class PhoneComponent {
    constructor(aPhoneCmd) {
        this._phoneCmd = aPhoneCmd;
    }

    showPhoneNumberOnClick() {
        const startTime = performance.now();
        const decryptionAlgorithm = DecryptionAlgorithmBuilder.create(
            this._getKey(), 
            this._getPhoneNumber()
        );
        const phoneNumber = decryptionAlgorithm.decrypt();
        const translator = new PhoneNumberTranslator(this._getKey(), phoneNumber);
        const translatedPhoneNumber = translator.translate();
        const endTime = performance.now();

        console.log("Duration : " + (endTime - startTime) + " (ms)");

        this._replaceContent(phoneNumber);
        this._replaceHrefValue(translatedPhoneNumber);
    }

    _replaceContent(aPhoneNumber) {
        const phoneNumber = `Appeler le : ${aPhoneNumber}`;
        $(`#${this._phoneCmd.htmlPhoneID}`).text(phoneNumber);
    }

    _replaceHrefValue(aTranslatedPhoneNumber) {
        $(`#${this._phoneCmd.htmlPhoneID}`).attr("href", aTranslatedPhoneNumber);
    }

    _getPhoneNumber() {
        return this._getPhoneData()?.phone;
    }

    _getKey() {
        return this._getPhoneData()?.key;
    }

    _getPhoneData() {
        return this._phoneCmd.phoneNumberList.find(
            phoneData => phoneData.phoneID === this._phoneCmd.jsonPhoneID
        );
    }
}

class PhoneCmd {
    constructor(aJsonPhoneID, aHtmlPhoneID, phoneNumberList) {
        this._jsonPhoneID = aJsonPhoneID;
        this._htmlPhoneID = aHtmlPhoneID;
        this._phoneNumberList = phoneNumberList;
    }

    get jsonPhoneID() {
        return this._jsonPhoneID;
    }

    get htmlPhoneID() {
        return this._htmlPhoneID;
    }

    get phoneNumberList() {
        return this._phoneNumberList;
    }
}

class PhoneNumber {
    constructor(aPhoneID, aPhoneNumber, aKey) {
        this._phoneID = aPhoneID;
        this._phone = aPhoneNumber;
        this._key = aKey;
    }

    get phoneID() {
        return this._phoneID;
    }

    get phone() {
        return this._phone;
    }

    get key() {
        return this._key;
    }
}

class PhoneNumberTranslator {
    constructor(aKey, aProcessedPhoneNumber) {
        this._key = aKey;
        this._processedPhoneNumber = aProcessedPhoneNumber;
    }

    translate() {
        return `tel:${this._transformPhoneNumber()}`;
    }

    _transformPhoneNumber() {
        const prefixTranslated = this._translatePrefixNumber();
        const translatedPhoneNumber = this._translatePhoneNumber();
        return `${prefixTranslated}${translatedPhoneNumber}`;
    }

    _extractPrefixNumber() {
        const keyArray = this._key.split(PhoneConstants.FIRST_KEY_SEPARATOR);
        return keyArray[0].split(PhoneConstants.OTHER_KEY_SEPARATOR)[1];
    }

    _translatePrefixNumber() {
        const prefixNumber = this._extractPrefixNumber();
        if(prefixNumber == 'FR') {
            return '+33';
        } else {
            throw new Error("Préfixe non géré !!");
        }
    }

    _translatePhoneNumber() {
        let phoneNumber = this._processedPhoneNumber;
        phoneNumber = phoneNumber.replaceAll('.', '');
        phoneNumber = phoneNumber.substring(1, phoneNumber.length);
        return phoneNumber;
    }
}

class DecryptionAlgorithmBuilder {
    static create(aKey, aPhoneNumber) {
        if(aKey == undefined || aPhoneNumber == undefined) {
            throw new Error("La clé et/ou le numéro de téléphone n'ont pu être récupéré !!");
        }
        const keyArray = aKey.split(PhoneConstants.FIRST_KEY_SEPARATOR);
        const leftPartKeyArray = keyArray[0].split(PhoneConstants.OTHER_KEY_SEPARATOR);
        if(leftPartKeyArray[0] == "b0") {
            return new BasicDecryptionAlgorithm(aKey, aPhoneNumber);
        } else {
            throw new Error("Algorithme de déchiffrement inconnu !!");
        }
    }
}

class ADecryptionAlgorithm {
    decrypt() {
        throw new Error("Cette algorithme de déchiffrement ne fait rien !!");
    }
}

class BasicDecryptionAlgorithm extends ADecryptionAlgorithm {
    constructor(aKey, aPhoneNumber) {
        super();
        this._key = aKey;
        this._phoneNumberEncrypted = aPhoneNumber;
    }

    decrypt() {
        return this._decryptPhoneNumber();
    }

    _decryptPhoneNumber() {
        let decryptedPhoneNumber = "";
        const rightKeyArray = this._getRightKeyArray();
        for(let it = 0 ; it < rightKeyArray.length ; it++) {
            const keyNumber = rightKeyArray[it];
            const partPhoneNumber = this._phoneNumberEncrypted.charCodeAt(it);
            const realPartNumber = partPhoneNumber - keyNumber;
            if(decryptedPhoneNumber.length > 0) {
                decryptedPhoneNumber += PhoneConstants.PHONE_NUMBER_SEPARATOR;
            }
            if(realPartNumber < 10) {
                decryptedPhoneNumber += "0";
            }
            decryptedPhoneNumber += realPartNumber.toString();
        }
        return decryptedPhoneNumber;
    }

    _getRightKeyArray() {
        const keyArray = this._key.split(PhoneConstants.FIRST_KEY_SEPARATOR);
        return keyArray[1].split(PhoneConstants.OTHER_KEY_SEPARATOR);
    }

}

class PhoneConstants {
    static get PHONE_NUMBER_SEPARATOR() {
        return ".";
    }

    static get FIRST_KEY_SEPARATOR() {
        return "-";
    }

    static get OTHER_KEY_SEPARATOR() {
        return ":";
    }
}