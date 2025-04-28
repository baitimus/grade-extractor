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
            
            if (data.inaCourses.length === 0 && data.bmCourses.length === 0 && data.otherCourses.length === 0) {
              gradesContainer.innerHTML = '<p>No grades found on this page. Make sure you are on the correct page.</p>';
              return;
            }
            
            // Create overall container
            const container = document.createElement('div');
            
            // Calculate and display the summary for each school
            const inaAverage = calculateRoundedAverage(data.inaCourses);
            const bmAverage = calculateRoundedAverage(data.bmCourses);
            const otherAverage = calculateRoundedAverage(data.otherCourses);
            
            // Add the summary section
            addSummarySection(container, inaAverage, bmAverage, otherAverage);
            
            // Add course lists (simplified)
            if (data.inaCourses.length > 0) {
              addSimpleCourseSection(container, data.inaCourses, 'INA School Courses');
            }
            
            if (data.bmCourses.length > 0) {
              addSimpleCourseSection(container, data.bmCourses, 'BM School Courses');
            }
            
            if (data.otherCourses.length > 0) {
              addSimpleCourseSection(container, data.otherCourses, 'Other Courses');
            }
            
            // Check promotion status
            const allCourses = [...data.inaCourses, ...data.bmCourses, ...data.otherCourses];
            addPromotionStatus(container, inaAverage, bmAverage, allCourses);
            
            gradesContainer.appendChild(container);
          } else {
            gradesContainer.innerHTML = '<p>Error extracting grades.</p>';
          }
        });
      });
    });
    
    // Round to 0.25 steps to the nearest half grade
    function roundGrade(grade) {
      // For values ending in .75, round up to the next full number
      if (grade % 1 >= 0.75) {
        return Math.ceil(grade);
      }
      
      // Otherwise round to nearest 0.25
      return Math.round(grade * 4) / 4;
    }
    
    function calculateRoundedAverage(courses) {
      // Filter only courses with numeric grades
      const gradedCourses = courses.filter(course => course.numericGrade > 0);
      
      if (gradedCourses.length === 0) {
        return 0;
      }
      
      // Calculate the sum of all grades
      const totalGrade = gradedCourses.reduce((sum, course) => sum + course.numericGrade, 0);
      
      // Calculate the average and round to 0.25 steps
      const average = totalGrade / gradedCourses.length;
      return roundGrade(average);
    }
    
    function addSummarySection(container, inaAverage, bmAverage, otherAverage) {
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'summary-section';
      summaryDiv.style.marginBottom = '20px';
      summaryDiv.style.padding = '10px';
      summaryDiv.style.backgroundColor = '#f0f7ff';
      summaryDiv.style.borderRadius = '4px';
      summaryDiv.style.border = '1px solid #c0d6f9';
      
      const summaryTitle = document.createElement('h2');
      summaryTitle.textContent = 'Grade Summary';
      summaryTitle.style.fontSize = '16px';
      summaryTitle.style.marginTop = '0';
      summaryTitle.style.marginBottom = '10px';
      summaryDiv.appendChild(summaryTitle);
      
      const summaryTable = document.createElement('table');
      summaryTable.style.width = '100%';
      
      // Add header row
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      const schoolHeader = document.createElement('th');
      schoolHeader.textContent = 'School';
      
      const averageHeader = document.createElement('th');
      averageHeader.textContent = 'Average Grade';
      
      headerRow.appendChild(schoolHeader);
      headerRow.appendChild(averageHeader);
      thead.appendChild(headerRow);
      summaryTable.appendChild(thead);
      
      // Add body rows
      const tbody = document.createElement('tbody');
      
      // INA School row
      if (inaAverage > 0) {
        const inaRow = document.createElement('tr');
        
        const inaCell = document.createElement('td');
        inaCell.textContent = 'INA School';
        
        const inaAvgCell = document.createElement('td');
        inaAvgCell.textContent = inaAverage.toFixed(2);
        inaAvgCell.style.fontWeight = 'bold';
        
        inaRow.appendChild(inaCell);
        inaRow.appendChild(inaAvgCell);
        tbody.appendChild(inaRow);
      }
      
      // BM School row
      if (bmAverage > 0) {
        const bmRow = document.createElement('tr');
        
        const bmCell = document.createElement('td');
        bmCell.textContent = 'BM School';
        
        const bmAvgCell = document.createElement('td');
        bmAvgCell.textContent = bmAverage.toFixed(2);
        bmAvgCell.style.fontWeight = 'bold';
        
        bmRow.appendChild(bmCell);
        bmRow.appendChild(bmAvgCell);
        tbody.appendChild(bmRow);
      }
      
      // Other courses row
      if (otherAverage > 0) {
        const otherRow = document.createElement('tr');
        
        const otherCell = document.createElement('td');
        otherCell.textContent = 'Other Courses';
        
        const otherAvgCell = document.createElement('td');
        otherAvgCell.textContent = otherAverage.toFixed(2);
        otherAvgCell.style.fontWeight = 'bold';
        
        otherRow.appendChild(otherCell);
        otherRow.appendChild(otherAvgCell);
        tbody.appendChild(otherRow);
      }
      
      summaryTable.appendChild(tbody);
      summaryDiv.appendChild(summaryTable);
      container.appendChild(summaryDiv);
    }
    
    function addSimpleCourseSection(container, courses, title) {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'course-section';
      sectionDiv.style.marginBottom = '15px';
      
      // Add section title
      const sectionTitle = document.createElement('h2');
      sectionTitle.textContent = title;
      sectionTitle.style.fontSize = '16px';
      sectionTitle.style.marginTop = '15px';
      sectionTitle.style.marginBottom = '10px';
      sectionDiv.appendChild(sectionTitle);
      
      // Create simple table
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
      
      courses.forEach(function(course) {
        const row = document.createElement('tr');
        
        const courseCell = document.createElement('td');
        courseCell.textContent = course.name;
        
        const gradeCell = document.createElement('td');
        gradeCell.textContent = course.grade;
        
        // Color code based on grade
        if (course.numericGrade >= 4.0) {
          gradeCell.style.color = 'green';
        } else if (course.numericGrade > 0) {
          gradeCell.style.color = 'red';
        }
        
        row.appendChild(courseCell);
        row.appendChild(gradeCell);
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      sectionDiv.appendChild(table);
      container.appendChild(sectionDiv);
    }
    
    function addPromotionStatus(container, inaAverage, bmAverage, allCourses) {
      const promotionDiv = document.createElement('div');
      promotionDiv.className = 'promotion-status';
      promotionDiv.style.marginTop = '20px';
      promotionDiv.style.padding = '15px';
      promotionDiv.style.border = '1px solid #ddd';
      promotionDiv.style.borderRadius = '4px';
      promotionDiv.style.backgroundColor = '#f9f9f9';
      
      const promotionTitle = document.createElement('h2');
      promotionTitle.textContent = 'Promotion Status';
      promotionTitle.style.fontSize = '18px';
      promotionTitle.style.marginTop = '0';
      promotionTitle.style.marginBottom = '15px';
      promotionDiv.appendChild(promotionTitle);
      
      // Filter only courses with numeric grades
      const gradedCourses = allCourses.filter(course => course.numericGrade > 0);
      
      if (gradedCourses.length === 0) {
        const noGradesMsg = document.createElement('p');
        noGradesMsg.textContent = 'No graded courses found.';
        promotionDiv.appendChild(noGradesMsg);
        container.appendChild(promotionDiv);
        return;
      }
      
      // Count failing grades and calculate deficit
      const failingCourses = gradedCourses.filter(course => course.numericGrade < 4.0);
      const gradeDeficit = failingCourses.reduce((sum, course) => sum + (4.0 - course.numericGrade), 0);
      
      // Create simple promotion status
      const overallAverage = ((inaAverage > 0 ? inaAverage : 0) + (bmAverage > 0 ? bmAverage : 0)) / 
                            ((inaAverage > 0 ? 1 : 0) + (bmAverage > 0 ? 1 : 0));
      
      const avgMet = overallAverage >= 4.0;
      const deficitMet = gradeDeficit <= 2.0;
      const countMet = failingCourses.length <= 2;
      const isPromoted = avgMet && deficitMet && countMet;
      
      // Create promotion result display
      const promotionResult = document.createElement('div');
      promotionResult.style.fontSize = '16px';
      promotionResult.style.fontWeight = 'bold';
      promotionResult.style.padding = '10px';
      promotionResult.style.borderRadius = '4px';
      promotionResult.style.backgroundColor = isPromoted ? '#dff0d8' : '#f2dede';
      promotionResult.style.color = isPromoted ? '#3c763d' : '#a94442';
      promotionResult.style.textAlign = 'center';
      promotionResult.style.marginBottom = '15px';
      
      promotionResult.textContent = isPromoted 
        ? 'PROMOTED to next semester ✓' 
        : 'NOT PROMOTED to next semester ✗';
      
      promotionDiv.appendChild(promotionResult);
      
      // Add summary of checks
      const checksDiv = document.createElement('div');
      checksDiv.style.fontSize = '14px';
      
      // Average check
      const avgCheck = document.createElement('p');
      avgCheck.style.margin = '5px 0';
      avgCheck.innerHTML = `<span style="color:${avgMet ? 'green' : 'red'}">${avgMet ? '✓' : '✗'}</span> Overall average: <strong>${overallAverage.toFixed(2)}</strong> (min. 4.0 required)`;
      checksDiv.appendChild(avgCheck);
      
      // Grade deficit check
      const deficitCheck = document.createElement('p');
      deficitCheck.style.margin = '5px 0';
      deficitCheck.innerHTML = `<span style="color:${deficitMet ? 'green' : 'red'}">${deficitMet ? '✓' : '✗'}</span> Grade deficit: <strong>${gradeDeficit.toFixed(2)}</strong> (max. 2.0 allowed)`;
      checksDiv.appendChild(deficitCheck);
      
      // Failed courses count check
      const countCheck = document.createElement('p');
      countCheck.style.margin = '5px 0';
      countCheck.innerHTML = `<span style="color:${countMet ? 'green' : 'red'}">${countMet ? '✓' : '✗'}</span> Failing grades: <strong>${failingCourses.length}</strong> (max. 2 allowed)`;
      checksDiv.appendChild(countCheck);
      
      promotionDiv.appendChild(checksDiv);
      container.appendChild(promotionDiv);
    }
  });
  
  // This function will be injected into the page context
  function extractGrades() {
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