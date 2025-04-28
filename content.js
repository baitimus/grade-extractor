// content.js
function extractGradesFromPage() {
    // Find the grades table
    const table = document.querySelector('table.mdl-data-table.mdl-js-data-table.mdl-table--listtable');
    
    if (!table) {
      return { 
        inaCourses: [],
        bmCourses: [],
        otherCourses: []
      };
    }
    
    const inaCourses = [];
    const bmCourses = [];
    const otherCourses = [];
    
    // Function to round grades correctly
    function roundGrade(grade) {
      // For values ending in .75, round up to the next full number
      if (grade % 1 >= 0.75) {
        return Math.ceil(grade);
      }
      
      // Otherwise round to nearest 0.25
      return Math.round(grade * 4) / 4;
    }
    
    // Get all rows (skip the header row)
    const rows = Array.from(table.querySelectorAll('tbody > tr')).filter(row => 
      !row.querySelector('th') && !row.className.includes('detailrow')
    );
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      
      if (cells.length >= 2) {
        // First cell contains course name
        const courseNameCell = cells[0];
        let courseCode = '';
        
        // Get the bold text (course code)
        const boldElement = courseNameCell.querySelector('b');
        if (boldElement) {
          courseCode = boldElement.textContent.trim();
        }
        
        // Add the course description if available
        const courseDesc = courseNameCell.textContent.replace(courseCode, '').trim();
        const courseName = courseCode + (courseDesc ? ` - ${courseDesc}` : '');
        
        // Second cell contains grade average
        const gradeCell = cells[1];
        const gradeText = gradeCell.textContent.trim();
        let numericGrade = parseFloat(gradeText) || 0;
        
        // Round the grade if it's a number
        if (numericGrade > 0) {
          numericGrade = roundGrade(numericGrade);
        }
        
        const courseData = {
          code: courseCode,
          name: courseName,
          grade: numericGrade > 0 ? numericGrade.toFixed(2) : gradeText,
          numericGrade: numericGrade
        };
        
        // Categorize the course based on its code
        if (courseCode.includes('S-INA24aL-Scc') || courseCode.toLowerCase().includes('ina')) {
          inaCourses.push(courseData);
        } else if (courseCode.includes('BMFR-E-BMLT24b') || courseCode.toLowerCase().includes('bm')) {
          bmCourses.push(courseData);
        } else {
          otherCourses.push(courseData);
        }
      }
    });
    
    return { inaCourses, bmCourses, otherCourses };
  }