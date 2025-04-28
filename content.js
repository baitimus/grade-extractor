// content.js
function extractGradesFromPage() {
    // Find the grades table
    const table = document.querySelector('table.mdl-data-table.mdl-js-data-table.mdl-table--listtable');
    
    if (!table) {
      return { courses: [] };
    }
    
    const courses = [];
    
    // Get all rows (skip the header row)
    const rows = Array.from(table.querySelectorAll('tbody > tr')).filter(row => 
      !row.querySelector('th') && !row.className.includes('detailrow')
    );
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      
      if (cells.length >= 2) {
        // First cell contains course name
        const courseNameCell = cells[0];
        let courseName = '';
        
        // Get the bold text (course code)
        const boldElement = courseNameCell.querySelector('b');
        if (boldElement) {
          courseName = boldElement.textContent.trim();
        }
        
        // Add the course description if available
        const courseDesc = courseNameCell.textContent.replace(courseName, '').trim();
        if (courseDesc) {
          courseName += ' - ' + courseDesc;
        }
        
        // Second cell contains grade average
        const gradeCell = cells[1];
        const grade = gradeCell.textContent.trim();
        
        courses.push({
          name: courseName,
          grade: grade
        });
      }
    });
    
    return { courses };
  }
  
  // This function can be called from popup.js