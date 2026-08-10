const config = require('../config/env');

class CalculationService {
  
  calculateSubjectAverage(ccNote, examNote, rattrapageNote = null, evaluationMode = 'MIXTE') {
    let average = null;
    
    const cc = (ccNote !== null && ccNote !== undefined && ccNote !== '') ? parseFloat(ccNote) : null;
    const exam = (examNote !== null && examNote !== undefined && examNote !== '') ? parseFloat(examNote) : null;
    const rattrapage = (rattrapageNote !== null && rattrapageNote !== undefined && rattrapageNote !== '') ? parseFloat(rattrapageNote) : null;
    
    // Rattrapage remplace toujours la moyenne si présent
    if (rattrapage !== null && !isNaN(rattrapage)) {
      return parseFloat(rattrapage.toFixed(2));
    }
    
    // Logique selon le mode d'évaluation
    switch (evaluationMode) {
      case 'MIXTE':
        // Cas normal: CC + EXAM
        if (cc !== null && exam !== null) {
          average = (cc * config.ccWeight) + (exam * config.examWeight);
        }
        // Cas fréquent: seul l'examen est saisi (enseignant n'a pas fait de CC)
        else if (exam !== null) {
          average = exam;
        }
        // Si seul CC existe, on l'utilise aussi (rare mais possible)
        else if (cc !== null) {
          average = cc;
        }
        break;
        
      case 'EXAM_ONLY':
        // Seul l'examen compte, CC ignoré même si présent
        if (exam !== null) {
          average = exam;
        }
        break;
        
      case 'CC_ONLY':
        // Seul le CC compte, examen ignoré même si présent
        if (cc !== null) {
          average = cc;
        }
        break;
        
      default:
        // Par défaut: comportement MIXTE
        if (cc !== null && exam !== null) {
          average = (cc * config.ccWeight) + (exam * config.examWeight);
        } else if (exam !== null) {
          average = exam;
        } else if (cc !== null) {
          average = cc;
        }
    }
    
    return (average !== null && !isNaN(average)) ? parseFloat(average.toFixed(2)) : null;
  }
  
  calculateUEAverage(subjectsWithAverages) {
    let totalWeighted = 0;
    let totalCoeff = 0;
    
    for (const subject of subjectsWithAverages) {
      if (subject.average !== null && !isNaN(subject.average)) {
        totalWeighted += subject.average * subject.coefficient;
        totalCoeff += subject.coefficient;
      }
    }
    
    if (totalCoeff === 0) return null;
    return parseFloat((totalWeighted / totalCoeff).toFixed(2));
  }
  
  calculateSemesterAverage(uesWithAverages) {
    let totalWeighted = 0;
    let totalCoeff = 0;
    
    for (const ue of uesWithAverages) {
      if (ue.average !== null && !isNaN(ue.average)) {
        totalWeighted += ue.average * ue.coefficient;
        totalCoeff += ue.coefficient;
      }
    }
    
    if (totalCoeff === 0) return null;
    return parseFloat((totalWeighted / totalCoeff).toFixed(2));
  }
  
  applyCompensation(ueAverage, semesterAverage) {
    if (ueAverage === null) return false;
    if (ueAverage >= 10) return true;
    if (ueAverage < 10 && semesterAverage !== null && semesterAverage >= 10) return true;
    return false;
  }
  
  validateUE(ueAverage, semesterAverage, ueTotalCredits) {
    const isValidated = this.applyCompensation(ueAverage, semesterAverage);
    const creditsAcquired = isValidated ? ueTotalCredits : 0;
    const isCompensated = (ueAverage !== null && ueAverage < 10 && semesterAverage !== null && semesterAverage >= 10);
    
    return {
      isValidated,
      creditsAcquired,
      isCompensated
    };
  }
  
  /**
   * @param {number} creditsAcquired - Crédits effectivement acquis (somme des UE validées)
   * @param {number} requiredSemesterCredits - Total des crédits du semestre (somme des matières / UE)
   */
  validateSemester(creditsAcquired, requiredSemesterCredits) {
    const req = Number(requiredSemesterCredits);
    const got = Number(creditsAcquired);
    if (!req || req <= 0 || Number.isNaN(req)) return false;
    if (Number.isNaN(got)) return false;
    return got >= req;
  }
  
  calculateAnnualAverage(semester5Average, semester6Average) {
    if (semester5Average === null || semester6Average === null) return null;
    return parseFloat(((semester5Average + semester6Average) / 2).toFixed(2));
  }
  
  decideJury(semester5Validated, semester6Validated, semester6Credits, hasSoutenance = true, ue6_2Validated = true) {
    // Cas 1: Tout validé = Diplômé
    if (semester5Validated && semester6Validated) {
      return 'DIPLÔMÉ';
    }
    
    // Cas 2: S5 validé + S6 crédits ≥ 22 mais UE6-2 (soutenance) non validée
    // = Reprise de soutenance (règle spéciale du cahier)
    if (semester5Validated && semester6Credits >= 22 && !ue6_2Validated) {
      return 'REPRISE_SOUTENANCE';
    }
    
    // Cas 3: Aucun semestre validé = Redouble
    if (!semester5Validated && !semester6Validated) {
      return 'REDOUBLE';
    }
    
    // Cas 4: Sinon non diplômé
    return 'NON_DIPLÔMÉ';
  }
  
  calculateMention(average) {
    if (average === null) return null;
    if (average >= 16) return 'TRÈS_BIEN';
    if (average >= 14) return 'BIEN';
    if (average >= 12) return 'ASSEZ_BIEN';
    if (average >= 10) return 'PASSABLE';
    return null;
  }
  
  applyAbsencePenalty(average, absenceHours) {
    if (average === null) return null;
    if (!absenceHours || absenceHours === 0) return average;
    const penalty = absenceHours * config.penaltyAbsence;
    const newAverage = Math.max(0, average - penalty);
    return parseFloat(newAverage.toFixed(2));
  }
}

module.exports = new CalculationService();
