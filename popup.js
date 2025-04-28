// popup.js
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('extractBtn').addEventListener('click', function() {
      const loadingDiv = document.getElementById('loading');
      const gradesContainer = document.getElementById('gradesContainer');
      
      loadingDiv.style.display = 'block';
      gradesContainer.innerHTML = '';
      
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          function: extractGrades
        }, function(results) {
          loadingDiv.style.display = 'none';
          
          if (results && results[0] && results[0].result) {
            const data = results[0].result;
            
            if (data.courses.length === 0) {
              gradesContainer.innerHTML = '<p>No grades found on this page. Make sure you are on the correct page.</p>';
              return;
            }
            
            // Create table
            const table = document.createElement('table');
            
            // Table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const courseHeader = document.createElement('th');
            courseHeader.textContent = 'Course';
            const gradeHeader = document.createElement('th');
            gradeHeader.textContent = 'Grade';
            
            headerRow.appendChild(courseHeader);
            headerRow.appendChild(gradeHeader);
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Table body
            const tbody = document.createElement('tbody');
            let validGradeCount = 0;
            let gradeSum = 0;
            
            data.courses.forEach(function(course) {
              const row = document.createElement('tr');
              
              const courseCell = document.createElement('td');
              courseCell.textContent = course.name;
              
              const gradeCell = document.createElement('td');
              gradeCell.textContent = course.grade;
              
              // Add to average calculation if it's a numeric grade
              const numericGrade = parseFloat(course.grade);
              if (!isNaN(numericGrade)) {
                gradeSum += numericGrade;
                validGradeCount++;
              }
              
              row.appendChild(courseCell);
              row.appendChild(gradeCell);
              tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            gradesContainer.appendChild(table);
            
            // Calculate and display average grade
            if (validGradeCount > 0) {
              const average = gradeSum / validGradeCount;
              const averageDiv = document.createElement('div');
              averageDiv.className = 'average';
              averageDiv.textContent = `Average Grade: ${average.toFixed(2)}`;
              gradesContainer.appendChild(averageDiv);
            }
          } else {
            gradesContainer.innerHTML = '<p>Error extracting grades.</p>';
          }
        });
      });
    });
  });
  
  function extractGrades() {
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