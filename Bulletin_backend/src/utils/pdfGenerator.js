const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const BLUE = '#1e3a8a';
const UE_HEADER_FILL = '#1e3a8a';
const LIGHT_HEADER = '#dbeafe';
const BORDER = '#1e3a8a';
const GRID = '#cbd5e1';
const ORANGE_ABS = '#ea580c';

const FS_TITLE = 11;
const FS_SUB = 9;
const FS_BODY = 8;
const FS_TINY = 6;

const M = 28;
const PAGE_W = 595;
const TABLE_W = PAGE_W - M * 2;
/** Bas utile : une seule page, tout le contenu doit tenir en dessous */
/** Matière | Crédits | Coef | Note étudiant | Moy. classe (modèle officiel) */
function gradeColumnXs() {
  const wM = 228;
  const wCr = 40;
  const wCo = 44;
  const wN = 56;
  const wMc = TABLE_W - wM - wCr - wCo - wN;
  const x0 = M;
  return {
    x0,
    x1: x0 + wM,
    x2: x0 + wM + wCr,
    x3: x0 + wM + wCr + wCo,
    x4: x0 + wM + wCr + wCo + wN,
    x5: M + TABLE_W,
    wM,
    wCr,
    wCo,
    wN,
    wMc
  };
}

class PDFGenerator {
  formatNumber(value) {
    if (value === null || value === undefined || value === '-') return '-';
    if (typeof value === 'string') value = parseFloat(value);
    if (Number.isNaN(value)) return '-';
    return value.toFixed(2);
  }

  getBlueColor() {
    return BLUE;
  }

  formatBirthDate(dateVal) {
    if (!dateVal) return '—';
    const s = String(dateVal).slice(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const [, y, mo, d] = m;
      return `${d}/${mo}/${y}`;
    }
    return String(dateVal);
  }

  formatAcademicYearSlash(year) {
    if (!year) return '2024/2025';
    const s = String(year).replace(/\s/g, '');
    if (s.includes('/')) return s;
    const m = s.match(/^(\d{4})-(\d{4})$/);
    if (m) return `${m[1]}/${m[2]}`;
    return s;
  }

  _logoPath() {
    return path.join(__dirname, 'assets', 'logo-inptic.png');
  }

  async _tryQrBuffer(text, size = 48) {
    if (!text || !String(text).startsWith('http')) return null;
    try {
      return await QRCode.toBuffer(text, { type: 'png', width: size, margin: 0 });
    } catch {
      return null;
    }
  }

  /** Moyenne de classe pour une UE (moyenne des moyennes de matière pondérée par coef) */
  ueClassAverage(subjects, classAverages) {
    let num = 0;
    let den = 0;
    for (const s of subjects || []) {
      const coef = parseFloat(s.coefficient);
      const c = classAverages?.[s.id];
      if (c == null || Number.isNaN(coef) || coef <= 0) continue;
      const ca = parseFloat(c);
      if (Number.isNaN(ca)) continue;
      num += ca * coef;
      den += coef;
    }
    if (den <= 0) return null;
    return num / den;
  }

  /**
   * En-tête type modèle INPTIC : gauche institut + logo + direction, droite République + devise + filet
   */
  drawOfficialHeaderModel(doc, yStart) {
    let y = yStart;
    const colW = 268;
    const rightX = M + colW + 8;
    const rightW = TABLE_W - colW - 8;

    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(FS_TINY);
    doc.text(
      'INSTITUT NATIONAL DE LA POSTE, DES TECHNOLOGIES DE L\'INFORMATION ET DE LA COMMUNICATION',
      M,
      y,
      { width: colW, align: 'left', lineGap: 0.5 }
    );
    doc.fillColor('black');
    y += 26;

    const logoY = y;
    const logoPath = this._logoPath();
    let logoH = 36;
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, M, logoY, { height: 36, fit: [120, 36] });
        logoH = 38;
      } catch {
        doc.rect(M, logoY, 50, 28).stroke(BLUE);
        doc.fontSize(8).font('Helvetica-Bold').fillColor(BLUE).text('INPTIC', M + 8, logoY + 8);
        doc.fillColor('black');
      }
    } else {
      doc.rect(M, logoY, 50, 28).stroke(BLUE);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(BLUE).text('INPTIC', M + 8, logoY + 8);
      doc.fillColor('black');
    }

    doc.font('Helvetica-Bold').fontSize(FS_BODY).fillColor(BLUE);
    doc.text('RÉPUBLIQUE GABONAISE', rightX, logoY, { width: rightW, align: 'right' });
    doc.font('Helvetica').fontSize(FS_BODY).fillColor('black');
    doc.text('Union – Travail – Justice', rightX, logoY + 12, { width: rightW, align: 'right' });
    const dashY = logoY + 26;
    doc.save();
    doc.moveTo(rightX, dashY).lineTo(M + TABLE_W, dashY).dash(2, { space: 2 }).stroke(BLUE);
    doc.undash();
    doc.restore();

    y = logoY + logoH + 4;
    doc.font('Helvetica-Bold').fontSize(FS_BODY).fillColor(BLUE);
    doc.text('DIRECTION DES ETUDES ET DE LA PEDAGOGIE', M, y);
    doc.fillColor('black');
    return y + 14;
  }

  drawBulletinTitleModel(doc, semester, y) {
    y += 6;
    doc.fontSize(FS_TITLE + 1).font('Helvetica-Bold').fillColor(BLUE);
    const semLabel = semester.name || 'Semestre';
    doc.text(`Bulletin de notes du ${semLabel}`, M, y, { width: TABLE_W, align: 'center' });
    y += 16;
    doc.fontSize(FS_SUB).font('Helvetica');
    doc.fillColor('black');
    doc.text(`Année universitaire : ${this.formatAcademicYearSlash(semester.academicYear)}`, M, y, {
      width: TABLE_W,
      align: 'center'
    });
    return y + 18;
  }

  /** Bloc étudiant modèle : Classe puis Nom / Naissance */
  drawStudentBlockModel(doc, student, groupName, y) {
    const classLine = (groupName || '—').trim();
    const hClass = 16;
    const rowH = 16;
    const labelW = 118;
    const totalH = hClass + rowH * 2;

    doc.rect(M, y, TABLE_W, totalH).stroke(BLUE);
    doc.moveTo(M, y + hClass).lineTo(M + TABLE_W, y + hClass).stroke(GRID);
    doc.moveTo(M, y + hClass + rowH).lineTo(M + TABLE_W, y + hClass + rowH).stroke(GRID);
    doc.moveTo(M + labelW, y + hClass).lineTo(M + labelW, y + totalH).stroke(BLUE);

    doc.fontSize(FS_BODY).font('Helvetica-Bold').fillColor('black');
    doc.text(`Classe : ${classLine}`, M + 4, y + 3, { width: TABLE_W - 8 });
    y += hClass;

    doc.text('Nom(s) et Prénom(s)', M + 4, y + 3, { width: labelW - 8 });
    doc.fillColor(BLUE);
    doc.text(`${student.lastName || ''} ${student.firstName || ''}`.trim() || '—', M + labelW + 4, y + 3, {
      width: TABLE_W - labelW - 8
    });
    doc.fillColor('black');
    y += rowH;

    doc.font('Helvetica-Bold');
    doc.text('Date et lieu de naissance', M + 4, y + 3, { width: labelW - 8 });
    doc.font('Helvetica').fillColor('black');
    doc.text(
      `Né(e) le ${this.formatBirthDate(student.birthDate)} à ${student.birthPlace || '—'}`,
      M + labelW + 4,
      y + 3,
      { width: TABLE_W - labelW - 8 }
    );
    return y + rowH + 8;
  }

  drawGradesTableHeaderModel(doc, y, C) {
    const h = 26;
    doc.rect(M, y, TABLE_W, h).stroke(BLUE);
    doc.fillColor(LIGHT_HEADER);
    doc.rect(M + 0.5, y + 0.5, TABLE_W - 1, h - 1).fill();
    doc.fillColor('black');
    doc.fontSize(FS_TINY + 0.5).font('Helvetica-Bold');
    doc.text('', C.x0, y + 4);
    doc.text('Crédits', C.x1, y + 8, { width: C.wCr, align: 'center' });
    doc.text('Coefficients', C.x2, y + 8, { width: C.wCo, align: 'center' });
    doc.text('Notes de', C.x3, y + 3, { width: C.wN, align: 'center' });
    doc.text("l'étudiant", C.x3, y + 13, { width: C.wN, align: 'center' });
    doc.text('Moyenne', C.x4, y + 3, { width: C.wMc, align: 'center' });
    doc.text('de classe', C.x4, y + 13, { width: C.wMc, align: 'center' });
    for (const x of [C.x1, C.x2, C.x3, C.x4]) {
      doc.moveTo(x, y).lineTo(x, y + h).stroke(BLUE);
    }
    return y + h;
  }

  drawVerticals(doc, y, h, C) {
    for (const x of [C.x1, C.x2, C.x3, C.x4]) {
      doc.moveTo(x, y).lineTo(x, y + h).stroke(GRID);
    }
  }

  async generateBulletin(
    student,
    semester,
    semesterResult,
    ues,
    ueResults,
    subjectResults,
    allStudentsData = {},
    options = {}
  ) {
    const documentRef =
      options.documentRef ||
      `BULL-${semester.code || 'SEM'}-${student.matricule}-${new Date().toISOString().slice(0, 10)}`;
    const verifyBaseUrl = (options.verifyBaseUrl || '').trim();
    const verifyUrl =
      verifyBaseUrl && verifyBaseUrl.startsWith('http')
        ? `${verifyBaseUrl.replace(/\/$/, '')}?ref=${encodeURIComponent(documentRef)}`
        : '';

    const qrBuffer = verifyUrl ? await this._tryQrBuffer(verifyUrl, 44) : null;

    return new Promise((resolve) => {
      const doc = new PDFDocument({
        margin: M,
        size: 'A4',
        autoFirstPage: true,
        bufferPages: false
      });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const C = gradeColumnXs();
      const rowH = 11;

      let y = this.drawOfficialHeaderModel(doc, M);
      y = this.drawBulletinTitleModel(doc, semester, y);

      const groupName = student.Group?.name || 'ASUR';
      y = this.drawStudentBlockModel(doc, student, groupName, y);

      const totalSemCredits = ues.reduce(
        (sum, ue) => sum + (ue.Subjects || []).reduce((s, sub) => s + (sub.credits || 0), 0),
        0
      );

      y = this.drawGradesTableHeaderModel(doc, y, C);

      for (const ue of ues) {
        const subjects = ue.Subjects || [];
        const ueResult = ueResults.find((r) => r.ueId === ue.id);

        doc.rect(M, y, TABLE_W, 14).fillAndStroke(UE_HEADER_FILL, BLUE);
        doc.fillColor('white').font('Helvetica-Bold').fontSize(FS_TINY + 0.5);
        doc.text(`${(ue.code || '').toUpperCase()} : ${(ue.name || '').toUpperCase()}`, M + 4, y + 3, {
          width: TABLE_W - 8
        });
        doc.fillColor('black');
        y += 14;

        for (const subject of subjects) {
          const subjectResult = subjectResults.find((sr) => sr.subjectId === subject.id);
          const avg = subjectResult?.average;
          const classAvg = allStudentsData.classAverages?.[subject.id] ?? null;

          doc.rect(M, y, TABLE_W, rowH).stroke(GRID);
          doc.font('Helvetica').fontSize(FS_TINY + 0.5).fillColor('black');
          const name =
            subject.name.length > 48 ? `${subject.name.slice(0, 45)}…` : subject.name;
          doc.text(`  ${name}`, C.x0 + 2, y + 2, { width: C.wM - 4 });
          doc.text(String(subject.credits ?? '0'), C.x1, y + 2, { width: C.wCr, align: 'center' });
          const coef = typeof subject.coefficient === 'string' ? parseFloat(subject.coefficient) : subject.coefficient;
          doc.text(Number.isNaN(coef) ? '0.00' : coef.toFixed(2), C.x2, y + 2, {
            width: C.wCo,
            align: 'center'
          });
          doc.text(this.formatNumber(avg), C.x3, y + 2, { width: C.wN, align: 'center' });
          doc.text(this.formatNumber(classAvg), C.x4, y + 2, { width: C.wMc - 2, align: 'center' });
          this.drawVerticals(doc, y, rowH, C);
          y += rowH;
        }

        const totalUECredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
        const totalUECoef = subjects.reduce((sum, s) => {
          const c = typeof s.coefficient === 'string' ? parseFloat(s.coefficient) : s.coefficient || 0;
          return sum + (Number.isNaN(c) ? 0 : c);
        }, 0);
        const ueClassAvg = this.ueClassAverage(subjects, allStudentsData.classAverages);

        doc.rect(M, y, TABLE_W, rowH + 1).stroke(BLUE);
        doc.fillColor(LIGHT_HEADER);
        doc.rect(M + 0.5, y + 0.5, C.x3 - M - 0.5, rowH).fill();
        doc.rect(C.x3 + 0.5, y + 0.5, C.wN - 0.5, rowH).fill();
        doc.rect(C.x4 + 0.5, y + 0.5, C.wMc - 1, rowH).fill();
        doc.fillColor('black').font('Helvetica-Bold').fontSize(FS_TINY + 0.5);
        doc.text(`Moyenne ${ue.code || ue.name}`, C.x0 + 4, y + 2, { width: C.wM - 8 });
        doc.text(String(totalUECredits), C.x1, y + 2, { width: C.wCr, align: 'center' });
        doc.text(this.formatNumber(totalUECoef), C.x2, y + 2, { width: C.wCo, align: 'center' });
        doc.text(this.formatNumber(ueResult?.average), C.x3, y + 2, { width: C.wN, align: 'center' });
        doc.text(this.formatNumber(ueClassAvg), C.x4, y + 2, { width: C.wMc - 2, align: 'center' });
        this.drawVerticals(doc, y, rowH + 1, C);
        y += rowH + 2;
      }

      const totalAbs = Object.values(allStudentsData.absences || {}).reduce((sum, h) => sum + (h || 0), 0);
      const penW = 200;
      doc.rect(M, y, penW, 14).stroke(BLUE);
      doc.font('Helvetica-Bold').fontSize(FS_TINY + 0.5);
      doc.text("Pénalités d'absences", M + 4, y + 3);
      doc.rect(M + penW, y, 95, 14).stroke(BLUE);
      doc.fillColor(ORANGE_ABS).font('Helvetica');
      doc.text('0,01/heure', M + penW + 4, y + 3);
      doc.fillColor('black');
      doc.rect(M + penW + 95, y, TABLE_W - penW - 95, 14).stroke(BLUE);
      doc.text(`${totalAbs} heure(s)`, M + penW + 99, y + 3);
      y += 18;

      const semAvg = semesterResult?.average;
      const semM =
        semAvg !== null && semAvg !== undefined && !Number.isNaN(parseFloat(semAvg))
          ? this.formatNumber(semAvg)
          : '—';
      const classAvgStr =
        allStudentsData.semesterClassAverage != null && !Number.isNaN(allStudentsData.semesterClassAverage)
          ? this.formatNumber(allStudentsData.semesterClassAverage)
          : '—';

      doc.rect(M, y, TABLE_W, 22).stroke(BLUE);
      doc.fillColor(LIGHT_HEADER);
      doc.rect(M + 0.5, y + 0.5, TABLE_W - 1, 21).fill();
      doc.fillColor('black');
      doc.font('Helvetica-Bold').fontSize(FS_SUB);
      doc.text(`Moyenne ${semester.name || 'Semestre'}`, M, y + 4, { width: TABLE_W, align: 'center' });
      doc.font('Helvetica').fontSize(FS_BODY);
      doc.text(`Étudiant : ${semM} / 20`, M, y + 14, { width: TABLE_W / 2, align: 'center' });
      doc.text(`Moyenne de classe : ${classAvgStr} / 20`, M + TABLE_W / 2, y + 14, {
        width: TABLE_W / 2,
        align: 'center'
      });
      y += 26;

      doc.rect(M, y, TABLE_W / 2 - 2, 14).stroke(BLUE);
      doc.rect(M + TABLE_W / 2 + 2, y, TABLE_W / 2 - 2, 14).stroke(BLUE);
      doc.fontSize(FS_TINY + 0.5).font('Helvetica-Bold');
      doc.text("Rang de l'étudiant au Semestre", M + 4, y + 3, { width: TABLE_W / 2 - 12, align: 'center' });
      doc.text('Mention', M + TABLE_W / 2 + 6, y + 3, { width: TABLE_W / 2 - 12, align: 'center' });
      y += 14;
      const rankText =
        allStudentsData.semesterRank && allStudentsData.totalStudents
          ? `${allStudentsData.semesterRank}ème / ${allStudentsData.totalStudents}`
          : 'Non classé';
      let mention = '—';
      const semAvgVal = semAvg !== null && semAvg !== undefined ? parseFloat(semAvg) : null;
      if (semAvgVal !== null && !Number.isNaN(semAvgVal)) {
        if (semAvgVal >= 16) mention = 'Très bien';
        else if (semAvgVal >= 14) mention = 'Bien';
        else if (semAvgVal >= 12) mention = 'Assez bien';
        else if (semAvgVal >= 10) mention = 'Passable';
        else mention = 'Insuffisant';
      }
      doc.font('Helvetica');
      doc.text(rankText, M + 4, y + 2, { width: TABLE_W / 2 - 12, align: 'center' });
      doc.text(mention, M + TABLE_W / 2 + 6, y + 2, { width: TABLE_W / 2 - 12, align: 'center' });
      y += 18;

      doc.font('Helvetica-Bold').fontSize(FS_SUB);
      doc.text(`Etat de la Validation des Crédits au ${semester.name || ''}`, M, y, {
        width: TABLE_W,
        align: 'center'
      });
      y += 14;

      const nUe = ues.length || 1;
      const creditsBoxW = 90; // Largeur fixe pour la boîte des crédits
      const boxW = (TABLE_W - creditsBoxW - 4 - (nUe - 1) * 4) / nUe;
      let xPos = M;
      for (const ue of ues) {
        const subjects = ue.Subjects || [];
        const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
        const ueResult = ueResults.find((r) => r.ueId === ue.id);
        const ok = ueResult?.isValidated === true;
        const acquiredRaw = ueResult?.creditsAcquired ?? 0;
        const creditsAff = ok ? totalCredits : acquiredRaw;
        const comp = ok && ueResult?.isCompensated;
        let status = 'Non acquise';
        if (ok) status = comp ? 'Compensée' : 'Acquise';

        doc.rect(xPos, y, boxW, 34).stroke(BLUE);
        doc.fontSize(FS_TINY).font('Helvetica-Bold');
        doc.text(ue.code || ue.name, xPos + 3, y + 3, { width: boxW - 6, align: 'center' });
        doc.font('Helvetica');
        doc.text(`${creditsAff} Crédits / ${totalCredits}`, xPos + 3, y + 14, { width: boxW - 6, align: 'center' });
        doc.fontSize(FS_TINY - 0.5);
        doc.fillColor(ok ? BLUE : 'black');
        doc.text(status, xPos + 3, y + 24, { width: boxW - 6, align: 'center' });
        doc.fillColor('black');
        xPos += boxW + 4;
      }

      const semOk = semesterResult?.isValidated === true;
      const semCreditsRaw = semesterResult?.totalCredits ?? 0;
      const semCreditsAff = semOk ? totalSemCredits : semCreditsRaw;
      const semComp =
        semOk &&
        ues.some((u) => {
          const ur = ueResults.find((r) => r.ueId === u.id);
          return ur?.isCompensated;
        });
      const boxHeight = 48;
      // Fond bleu clair pour plus de visibilité
      doc.rect(xPos, y, creditsBoxW, boxHeight).fill('#E3F2FD').stroke(BLUE);
      // Ligne 1: Titre + Semestre compact
      doc.fontSize(FS_TINY).font('Helvetica-Bold').fillColor('black');
      doc.text(`CRÉDITS ${(semester.name || 'SEMESTRE').toUpperCase()}`, xPos + 3, y + 4, { width: creditsBoxW - 6, align: 'center' });
      // Ligne 2: Nombre de crédits (gros)
      doc.fontSize(FS_TINY + 4).font('Helvetica-Bold').fillColor(semOk ? '#2E7D32' : '#C62828');
      doc.text(`${semCreditsAff}/${totalSemCredits}`, xPos + 3, y + 18, { width: creditsBoxW - 6, align: 'center' });
      // Ligne 3: Status
      doc.fontSize(FS_TINY - 0.5).fillColor(BLUE);
      let semStatus = 'Non validé';
      if (semOk) semStatus = semComp ? 'Validé par compensation' : 'Validé';
      doc.text(semStatus, xPos + 3, y + 36, { width: creditsBoxW - 6, align: 'center' });
      doc.fillColor('black');
      y += 54;

      let decisionLine = 'Décision du Jury : ';
      if (!semesterResult || semesterResult.average === null) {
        decisionLine += 'En attente';
      } else if (semesterResult.isValidated) {
        decisionLine += `${semester.name || 'Semestre'} validé`;
      } else {
        const avg = parseFloat(semesterResult.average);
        if (!Number.isNaN(avg) && avg >= 8 && avg < 10) {
          decisionLine += `${semester.name || 'Semestre'} non validé — compensation possible`;
        } else {
          decisionLine += `${semester.name || 'Semestre'} non validé`;
        }
      }
      doc.font('Helvetica-Bold').fontSize(FS_SUB).fillColor(BLUE);
      doc.text(decisionLine, M, y, { width: TABLE_W, align: 'center' });
      doc.fillColor('black');
      y += 20;

      const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.font('Helvetica').fontSize(FS_BODY);
      doc.text(`Fait à Libreville, le ${dateStr}`, M, y, { width: TABLE_W, align: 'center' });
      y += 12;
      doc.text('Le Directeur des Etudes et de la Pédagogie', M, y, { width: TABLE_W, align: 'center' });
      y += 14;
      doc.font('Helvetica-Bold').fillColor(BLUE).fontSize(FS_SUB + 1);
      doc.text('Davy Edgard MOUSSAVOU', M, y, { width: TABLE_W, align: 'center' });
      doc.fillColor('black');
      y += 28;

      if (qrBuffer) {
        try {
          doc.image(qrBuffer, M + TABLE_W - 46, y - 20, { width: 44, height: 44 });
        } catch {
          /* ignore */
        }
      }

      doc.font('Helvetica-Oblique').fontSize(FS_TINY);
      doc.text(
        "Il ne sera délivré qu'un seul et unique exemplaire de bulletins de notes. L'étudiant est donc prié d'en faire plusieurs copies légalisées.",
        M,
        y,
        { width: TABLE_W, align: 'center' }
      );
      y += 16;
      doc.font('Helvetica').fontSize(FS_TINY - 0.5).fillColor('#64748b');
      doc.text('Document généré automatiquement par le système académique INPTIC.', M, y, {
        width: TABLE_W,
        align: 'center'
      });

      doc.end();
    });
  }

  async generateBulletinAnnuel(
    student,
    annualResult,
    semester5Result,
    semester6Result,
    semester5Data = {},
    semester6Data = {}
  ) {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: M, size: 'A4' });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      let y = this.drawOfficialHeaderModel(doc, M);
      doc.fontSize(FS_TITLE + 2).font('Helvetica-Bold').fillColor(BLUE);
      doc.text('Bulletin de Notes Annuel', M, y, { width: TABLE_W, align: 'center' });
      doc.fillColor('black');
      y += 16;
      doc.fontSize(FS_SUB).font('Helvetica');
      doc.text(`Année universitaire : ${this.formatAcademicYearSlash(annualResult?.academicYear)}`, M, y, {
        width: TABLE_W,
        align: 'center'
      });
      y += 22;

      const groupName = student.Group?.name || 'ASUR';
      y = this.drawStudentBlockModel(doc, student, groupName, y);

      const colX = [M, M + 100, M + 180, M + 260, M + 340, M + 420];
      const colW = [100, 80, 80, 80, 80, TABLE_W - 420];

      doc.rect(M, y, TABLE_W, 32).stroke(BLUE);
      doc.fillColor(LIGHT_HEADER);
      doc.rect(M + 0.5, y + 0.5, TABLE_W - 1, 31).fill();
      doc.fillColor('black');
      doc.fontSize(FS_TINY).font('Helvetica-Bold');
      doc.text('Moyenne', colX[1], y + 4, { width: colW[1], align: 'center' });
      doc.text('Moyenne', colX[2], y + 4, { width: colW[2], align: 'center' });
      doc.text('Crédits', colX[3], y + 4, { width: colW[3], align: 'center' });
      doc.text('Rang', colX[4], y + 4, { width: colW[4], align: 'center' });
      doc.text('Décision', colX[5], y + 4, { width: colW[5] - 10, align: 'center' });
      doc.fontSize(FS_TINY - 1);
      doc.text('Étudiant', colX[1], y + 17, { width: colW[1], align: 'center' });
      doc.text('Classe', colX[2], y + 17, { width: colW[2], align: 'center' });
      for (let i = 1; i <= 5; i++) {
        doc.moveTo(colX[i], y).lineTo(colX[i], y + 32).stroke(BLUE);
      }
      y += 32;

      const rowH = 18;
      const drawRow = (label, sAvg, cAvg, cred, rank, dec) => {
        doc.rect(M, y, TABLE_W, rowH).stroke(BLUE);
        doc.fontSize(FS_BODY).font('Helvetica');
        doc.text(label, colX[0] + 4, y + 4);
        doc.text(this.formatNumber(sAvg), colX[1] + 4, y + 4, { width: colW[1] - 8, align: 'center' });
        doc.text(this.formatNumber(cAvg), colX[2] + 4, y + 4, { width: colW[2] - 8, align: 'center' });
        doc.text(cred, colX[3] + 4, y + 4, { width: colW[3] - 8, align: 'center' });
        doc.text(rank != null ? String(rank) : '-', colX[4] + 4, y + 4, { width: colW[4] - 8, align: 'center' });
        doc.text(dec, colX[5] + 4, y + 4, { width: colW[5] - 8, align: 'center' });
        for (let i = 1; i <= 5; i++) {
          doc.moveTo(colX[i], y).lineTo(colX[i], y + rowH).stroke(BLUE);
        }
        y += rowH;
      };

      drawRow(
        'Semestre 5',
        semester5Result?.average,
        semester5Data.classAverage,
        `${semester5Result?.totalCredits || 0}/30`,
        semester5Data.rank,
        semester5Result?.isValidated ? 'Validé' : 'Non validé'
      );
      drawRow(
        'Semestre 6',
        semester6Result?.average,
        semester6Data.classAverage,
        `${semester6Result?.totalCredits || 0}/30`,
        semester6Data.rank,
        semester6Result?.isValidated ? 'Validé' : 'Non validé'
      );

      doc.rect(M, y, TABLE_W, 20).stroke(BLUE);
      doc.fillColor(LIGHT_HEADER);
      doc.rect(M + 0.5, y + 0.5, TABLE_W - 1, 19).fill();
      doc.fillColor('black');
      doc.font('Helvetica-Bold');
      doc.text('ANNUEL', colX[0] + 4, y + 5);
      doc.text(this.formatNumber(annualResult?.average), colX[1] + 4, y + 5, { width: colW[1] - 8, align: 'center' });
      doc.text('—', colX[2] + 4, y + 5, { width: colW[2] - 8, align: 'center' });
      doc.text(`${annualResult?.totalCredits || 0}/60`, colX[3] + 4, y + 5, { width: colW[3] - 8, align: 'center' });
      doc.text('—', colX[4] + 4, y + 5, { width: colW[4] - 8, align: 'center' });
      const annualDecision = annualResult?.decision === 'DIPLÔMÉ' ? 'DIPLÔMÉ' : annualResult?.decision || 'En attente';
      doc.text(annualDecision, colX[5] + 4, y + 5, { width: colW[5] - 8, align: 'center' });
      for (let i = 1; i <= 5; i++) {
        doc.moveTo(colX[i], y).lineTo(colX[i], y + 20).stroke(BLUE);
      }
      y += 28;

      doc.fontSize(FS_SUB).font('Helvetica-Bold');
      doc.text("Détail par unité d'enseignement", M, y, { width: TABLE_W, align: 'center' });
      y += 16;

      const ueColX = [M, M + 220, M + 310, M + 400];
      const ueColW = [220, 90, 90, TABLE_W - 400];

      const drawUeBlock = (title, ueList) => {
        if (!ueList || !ueList.length) return;
        doc.fontSize(FS_BODY).font('Helvetica-Bold').fillColor(BLUE);
        doc.text(title, M, y);
        doc.fillColor('black');
        y += 12;
        doc.rect(M, y, TABLE_W, 16).stroke(BLUE);
        doc.fillColor(LIGHT_HEADER);
        doc.rect(M + 0.5, y + 0.5, TABLE_W - 1, 15).fill();
        doc.fillColor('black');
        doc.fontSize(FS_TINY).font('Helvetica-Bold');
        doc.text('UE', ueColX[0] + 4, y + 4);
        doc.text('Moyenne', ueColX[1] + 4, y + 4, { width: ueColW[1] - 8, align: 'center' });
        doc.text('Crédits', ueColX[2] + 4, y + 4, { width: ueColW[2] - 8, align: 'center' });
        doc.text('Statut', ueColX[3] + 4, y + 4, { width: ueColW[3] - 8, align: 'center' });
        for (let i = 1; i <= 3; i++) {
          doc.moveTo(ueColX[i], y).lineTo(ueColX[i], y + 16).stroke(BLUE);
        }
        y += 16;
        for (const ue of ueList) {
          doc.rect(M, y, TABLE_W, 14).stroke(GRID);
          doc.fontSize(FS_TINY).font('Helvetica');
          doc.text(ue.name.substring(0, 50), ueColX[0] + 4, y + 3, { width: ueColW[0] - 8 });
          doc.text(this.formatNumber(ue.average), ueColX[1] + 4, y + 3, { width: ueColW[1] - 8, align: 'center' });
          const creditsAcquired = ue.creditsAcquired || 0;
          const totalCredits = ue.totalCredits || 0;
          doc.text(`${creditsAcquired}/${totalCredits}`, ueColX[2] + 4, y + 3, { width: ueColW[2] - 8, align: 'center' });
          const isReallyValidated = creditsAcquired >= totalCredits && totalCredits > 0;
          const isCompensated = ue.isCompensated && isReallyValidated;
          const status = isReallyValidated ? (isCompensated ? 'Compensée' : 'Acquise') : 'Non acquise';
          doc.text(status, ueColX[3] + 4, y + 3, { width: ueColW[3] - 8, align: 'center' });
          for (let i = 1; i <= 3; i++) {
            doc.moveTo(ueColX[i], y).lineTo(ueColX[i], y + 14).stroke(GRID);
          }
          y += 14;
        }
        y += 6;
      };

      drawUeBlock('Semestre 5', semester5Data.ues);
      drawUeBlock('Semestre 6', semester6Data.ues);

      y += 8;
      const decision = annualResult?.decision || 'En attente';
      let decisionColor = 'black';
      let decisionText = decision;
      if (decision === 'DIPLÔMÉ') {
        decisionColor = '#16a34a';
        decisionText = 'DIPLÔMÉ';
      } else if (decision === 'REPRISE_SOUTENANCE') {
        decisionColor = '#d97706';
        decisionText = 'REPRISE DE SOUTENANCE';
      } else if (decision === 'REDOUBLE' || decision === 'NON_DIPLÔMÉ') {
        decisionColor = '#dc2626';
        decisionText = decision === 'REDOUBLE' ? 'REDOUBLE' : 'NON DIPLÔMÉ';
      }
      doc.fontSize(FS_SUB).font('Helvetica-Bold').fillColor('black');
      doc.text('Décision du jury : ', M, y);
      doc.fillColor(decisionColor);
      doc.text(decisionText, M + 118, y);
      doc.fillColor('black');
      y += 16;
      if (annualResult?.mention && decision === 'DIPLÔMÉ') {
        doc.fontSize(FS_BODY);
        doc.text(`Mention : ${annualResult.mention}`, M, y, { width: TABLE_W, align: 'center' });
        y += 14;
      }
      if (decision === 'REPRISE_SOUTENANCE') {
        doc.fontSize(FS_BODY).font('Helvetica');
        doc.text('(Étudiant admissible — doit repasser la soutenance.)', M, y, { width: TABLE_W, align: 'center' });
        y += 16;
      }

      y += 10;
      doc.fontSize(FS_BODY).font('Helvetica');
      doc.text(`Fait à Libreville, le ${new Date().toLocaleDateString('fr-FR')}`, M, y, { width: TABLE_W, align: 'center' });
      y += 12;
      doc.text('Le Directeur des Etudes et de la Pédagogie', M, y, { width: TABLE_W, align: 'center' });
      y += 14;
      doc.font('Helvetica-Bold').fillColor(BLUE);
      doc.text('Davy Edgard MOUSSAVOU', M, y, { width: TABLE_W, align: 'center' });
      doc.fillColor('black');
      y += 18;
      doc.fontSize(FS_TINY).font('Helvetica');
      doc.text('Document généré automatiquement par le système académique INPTIC.', M, y, {
        width: TABLE_W,
        align: 'center'
      });

      doc.end();
    });
  }
}

module.exports = new PDFGenerator();
