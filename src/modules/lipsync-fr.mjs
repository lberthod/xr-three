/**
* @class Processeur de synchronisation labiale en français
* @autor Mika Suominen
*/

class LipsyncFr {

  /**
  * @constructor
  */
  constructor() {

    // Règles de conversion des mots français en visèmes Oculus
    this.rules = {
      'A': [
        "[AI]=E", "[AU]=O", "[AN]=aa nn", "[AM]=aa nn", "[AON]=O nn",
        "[AOM]=O nn", "[A]=aa", "[Â]=aa", "[Ä]=aa"
      ],

      'B': [
        "[B]=PP"
      ],

      'C': [
        "[CH]=SH", "[CI]=SS", "[CE]=SS", "[CY]=SS", "[CA]=kk", "[CO]=kk",
        "[CU]=kk", "[CQU]=kk", "[C]=kk"
      ],

      'D': [
        "[D]=DD"
      ],

      'E': [
        "[É]=E", "[È]=E", "[Ê]=E", "[Ë]=E", "[E]AU=O", "[E]AI=E", "[E]I=E", "[EU]=E", 
        "[E]N=aa nn", "[E]M=aa nn", "[E]NT=", "[E]=E"
      ],

      'F': [
        "[F]=FF"
      ],

      'G': [
        "[GE]=SH", "[GI]=SH", "[GY]=SH", "[G]=kk"
      ],

      'H': [
        "[H]="
      ],

      'I': [
        "[IN]=aa nn", "[IM]=aa nn", "[IL]E=I L", "[ILL]=I L", "[I]=I", "[Î]=I", "[Ï]=I"
      ],

      'J': [
        "[J]=SH"
      ],

      'K': [
        "[K]=kk"
      ],

      'L': [
        "[L]=nn"
      ],

      'M': [
        "[M]=PP"
      ],

      'N': [
        "[NG]=nn kk", "[N]=nn"
      ],

      'O': [
        "[O]N=O nn", "[O]M=O nn", "[OU]=U", "[OI]=wa", "[OEU]=E",
        "[OE]=E", "[O]=O", "[Ô]=O"
      ],

      'P': [
        "[PH]=FF", "[P]=PP"
      ],

      'Q': [
        "[QU]=kk", "[Q]=kk"
      ],

      'R': [
        "[R]=RR"
      ],

      'S': [
        "[SH]=SH", "[SION]=SS aa nn", "[S]O=SS O", "[S]E=SS E", "[S]U=SS U", 
        "[S]=SS", "[SS]=SS"
      ],

      'T': [
        "[TI]ON=SS aa nn", "[TU]A=CH U", "[T]=DD"
      ],

      'U': [
        "[UN]=aa nn", "[UM]=aa nn", "[U]N=aa nn", "[UY]=aa", "[UE]=I U", "[U]=U", "[Û]=U", "[Ü]=U"
      ],

      'V': [
        "[V]=FF"
      ],

      'W': [
        "[W]=FF"
      ],

      'X': [
        "[X]=SS"
      ],

      'Y': [
        "[Y]=I"
      ],

      'Z': [
        "[Z]=SS"
      ]
    };

    const ops = {
      '#': '[AEIOUYÉÈÊËÎÏÔÛÜÂÄ]+', // Une ou plusieurs voyelles accentuées
      '.': '[BDVGJLMNRWZ]', // Une consonne sonore BDVGJLMNRWZ
      '%': '(?:ER|E|ES|ED|ING|EMENT|É|È|Ê)', // Une des séquences ER, E, ES, ED, ING, EMENT, É, È, Ê
      '&': '(?:[SCGZXJ]|CH|SH)', // Une des lettres S, C, G, Z, X, J, ou des digrammes CH, SH
      '@': '(?:[TSRDLZNJ]|TH|CH|SH)', // Une des lettres T, S, R, D, L, Z, N, J, TH, CH, SH
      '^': '[BCDFGHJKLMNPQRSTVWXZ]', // Une consonne BCDFGHJKLMNPQRSTVWXZ
      '+': '[EIY]', // Une des lettres E, I, Y
      ':': '[BCDFGHJKLMNPQRSTVWXZ]*', // Zéro ou plusieurs consonnes BCDFGHJKLMNPQRSTVWXZ
      ' ': '\\b' // Début/fin du mot
    };

    // Convertir les règles en expressions régulières
    Object.keys(this.rules).forEach(key => {
      this.rules[key] = this.rules[key].map(rule => {
        const posL = rule.indexOf('[');
        const posR = rule.indexOf(']');
        const posE = rule.indexOf('=');
        const strLeft = rule.substring(0, posL);
        const strLetters = rule.substring(posL + 1, posR);
        const strRight = rule.substring(posR + 1, posE);
        const strVisemes = rule.substring(posE + 1);

        const o = { regex: '', move: 0, visemes: [] };

        let exp = '';
        exp += [...strLeft].map(x => ops[x] || x).join('');
        const ctxLetters = [...strLetters];
        ctxLetters[0] = ctxLetters[0].toLowerCase();
        exp += ctxLetters.join('');
        o.move = ctxLetters.length;
        exp += [...strRight].map(x => ops[x] || x).join('');
        o.regex = new RegExp(exp);

        if (strVisemes.length) {
          strVisemes.split(' ').forEach(viseme => {
            o.visemes.push(viseme);
          });
        }

        return o;
      });
    });

    // Durées des visèmes en unité relative (1=durée moyenne)
    this.visemeDurations = {
      'aa': 0.95, 'E': 0.90, 'I': 0.92, 'O': 0.96, 'U': 0.95, 'PP': 1.08,
      'SS': 1.23, 'SH': 1.20, 'TH': 1, 'DD': 1.05, 'FF': 1.00, 'kk': 1.21, 'nn': 0.88,
      'RR': 0.88, 'sil': 1
    };

    // Durées des pauses en unités relatives (1=durée moyenne)
    this.specialDurations = { ' ': 1, ',': 3, '-': 0.5 };

    // Mots représentant les chiffres en français suisse
    this.digits = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    this.ones = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf'];
    this.tens = ['','dix','vingt','trente','quarante','cinquante','soixante','septante','huitante','nonante'];
    this.teens = ['dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];

    // Symboles à convertir en mots français
    this.symbols = {
      '%': 'pourcentage', '€': 'euros', '&': 'et', '+': 'plus',
      '$': 'dollars'
    };
    this.symbolsReg = /[%€&\+\$]/g;
  }

  /**
  * Convertir un nombre en mots, chiffre par chiffre
  * @param {number} num Nombre
  * @return {string} Représentation en mots du nombre.
  */
  convert_digit_by_digit(num) {
    num = String(num).split("");
    let numWords = "";
    for (let m = 0; m < num.length; m++) {
      numWords += this.digits[num[m]] + " ";
    }
    numWords = numWords.substring(0, numWords.length - 1); // Supprimer l'espace final
    return numWords;
  }

  /**
  * Convertir un nombre en mots, par ensembles de deux chiffres
  * @param {number} num Nombre
  * @return {string} Représentation en mots du nombre.
  */
  convert_sets_of_two(num) {
    let firstNumHalf = String(num).substring(0, 2);
    let secondNumHalf = String(num).substring(2, 4);
    let numWords = this.convert_tens(firstNumHalf);
    numWords += " " + this.convert_tens(secondNumHalf);
    return numWords;
  }

  /**
  * Convertir un nombre en mots (pour les millions)
  * @param {number} num Nombre
  * @return {string} Représentation en mots du nombre.
  */
  convert_millions(num) {
    if (num >= 1000000) {
      return this.convert_millions(Math.floor(num / 1000000)) + " million " + this.convert_thousands(num % 1000000);
    } else {
      return this.convert_thousands(num);
    }
  }

  /**
  * Convertir un nombre en mots (pour les milliers)
  * @param {number} num Nombre
  * @return {string} Représentation en mots du nombre.
  */
  convert_thousands(num) {
    if (num >= 1000) {
      return this.convert_hundreds(Math.floor(num / 1000)) + " mille " + this.convert_hundreds(num % 1000);
    } else {
      return this.convert_hundreds(num);
    }
  }

  /**
  * Convertir un nombre en mots (pour les centaines)
  * @param {number} num Nombre
  * @return {string} Représentation en mots du nombre.
  */
  convert_hundreds(num) {
    if (num > 99) {
      return this.ones[Math.floor(num / 100)] + " cent " + this.convert_tens(num % 100);
    } else {
      return this.convert_tens(num);
    }
  }

  /**
  * Convertir un nombre en mots (pour les dizaines)
  * @param {number} num Nombre
  * @return {string} Représentation en mots du nombre.
  */
  convert_tens(num) {
    if (num < 10) return this.ones[num];
    else if (num >= 10 && num < 20) {
      return this.teens[num - 10];
    } else {
      return this.tens[Math.floor(num / 10)] + " " + this.ones[num % 10];
    }
  }

  /**
  * Convertir un nombre en mots
  * @param {number} num Nombre
  * @return {string} Représentation en mots du nombre.
  */
  convertNumberToWords(num) {
    if (num == 0) {
      return "zéro";
    } else if ((num < 1000 && num > 99) || (num > 10000 && num < 1000000)) { // lire les codes postaux et les zones chiffre par chiffre
      return this.convert_digit_by_digit(num);
    } else if ((num > 1000 && num < 2000) || (num > 2009 && num < 3000)) { // lire les années en deux ensembles de deux chiffres
      return this.convert_sets_of_two(num);
    } else {
      return this.convert_millions(num);
    }
  }

  /**
  * Prétraiter le texte :
  * - convertir les symboles en mots
  * - convertir les nombres en mots
  * - filtrer les caractères qui ne devraient pas être prononcés
  * - gérer les "e" muets
  * @param {string} s Texte
  * @return {string} Texte prétraité.
  */
  preProcessText(s) {
    s = s.replace(/[#_*'":;]/g, '')
      .replace(this.symbolsReg, (symbol) => {
        return ' ' + this.symbols[symbol] + ' ';
      })
      .replace(/(\d)\,(\d)/g, '$1 virgule $2') // Séparateur de nombre
      .replace(/\d+/g, this.convertNumberToWords.bind(this)) // Nombres en mots
      .replace(/(\D)\1\1+/g, "$1$1") // max 2 caractères répétés
      .replaceAll('  ', ' ') // Un seul espace répété
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC') // Supprimer les diacritiques non français
      .trim();

    // Gérer les "e" muets en fin de mot sauf si précédé de voyelle accentuée
    s = s.replace(/(\b\w*e\b)(?=\s|$)/g, (match, p1) => /[ÉÈÊéèê]$/.test(p1) ? p1 : p1.slice(0, -1));

    return s;
  }

  /**
  * Convertir un mot en visèmes et durées Oculus LipSync
  * @param {string} w Texte
  * @return {Object} Visèmes et durées Oculus LipSync.
  */
  wordsToVisemes(w) {
    let o = { words: w.toUpperCase(), visemes: [], times: [], durations: [], i: 0 };
    let t = 0;

    const chars = [...o.words];
    while (o.i < chars.length) {
      const c = chars[o.i];
      const ruleset = this.rules[c];
      if (ruleset) {
        for (let i = 0; i < ruleset.length; i++) {
          const rule = ruleset[i];
          const test = o.words.substring(0, o.i) + c.toLowerCase() + o.words.substring(o.i + 1);
          let matches = test.match(rule.regex);
          if (matches) {
            rule.visemes.forEach(viseme => {
              if (o.visemes.length && o.visemes[o.visemes.length - 1] === viseme) {
                const d = 0.7 * (this.visemeDurations[viseme] || 1);
                o.durations[o.durations.length - 1] += d;
                t += d;
              } else {
                const d = this.visemeDurations[viseme] || 1;
                o.visemes.push(viseme);
                o.times.push(t);
                o.durations.push(d);
                t += d;
              }
            })
            o.i += rule.move;
            break;
          }
        }
      } else {
        o.i++;
        t += this.specialDurations[c] || 0;
      }
    }

    return o;
  }

}

export { LipsyncFr };
