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
            
            // Calculate the rounded averages for each school
            const inaAverage = calculateRoundedAverage(data.inaCourses);
            const bmAverage = calculateRoundedAverage(data.bmCourses);
            const otherAverage = calculateRoundedAverage(data.otherCourses);
            
            // Create the promotion status panel
            addPromotionStatus(container, inaAverage, bmAverage, [...data.inaCourses, ...data.bmCourses, ...data.otherCourses]);
            
            // Add compact school summary
            addCompactSchoolSummary(container, data, inaAverage, bmAverage, otherAverage);
            
            // Add the details toggle button and details section
            addDetailsSection(container, data);
            
            gradesContainer.appendChild(container);
          } else {
            gradesContainer.innerHTML = '<p>Error extracting grades.</p>';
          }
        });
      });
    });
    
    // Round to 0.25 steps to the nearest half grade
    function roundGrade(grade) {
     
      
      // Otherwise round to nearest 0.5
      return Math.round(grade * 2) / 2;
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
    
    function addCompactSchoolSummary(container, data, inaAverage, bmAverage, otherAverage) {
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'school-summary';
      summaryDiv.style.marginTop = '20px';
      summaryDiv.style.marginBottom = '20px';
      
      // Create the compact school grade panels
      if (data.inaCourses.length > 0) {
        const inaPanel = createSchoolPanel('INA School', data.inaCourses, inaAverage);
        summaryDiv.appendChild(inaPanel);
      }
      
      if (data.bmCourses.length > 0) {
        const bmPanel = createSchoolPanel('BM School', data.bmCourses, bmAverage);
        summaryDiv.appendChild(bmPanel);
      }
      
     /* if (data.otherCourses.length > 0) {
        const otherPanel = createSchoolPanel('Other Courses', data.otherCourses, otherAverage);
        summaryDiv.appendChild(otherPanel);}
      */
      
      container.appendChild(summaryDiv);
    }
    
    function createSchoolPanel(schoolName, courses, average) {
      const panel = document.createElement('div');
      panel.className = 'school-panel';
      panel.style.marginBottom = '12px';
      panel.style.padding = '12px';
      panel.style.borderRadius = '4px';
      panel.style.border = '1px solid #ddd';
      panel.style.backgroundColor = '#f9f9f9';
      
      // Create header row with school name and average
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.marginBottom = '8px';
      header.style.fontWeight = 'bold';
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = schoolName;
      
      const avgSpan = document.createElement('span');
      avgSpan.textContent = `Average: ${average.toFixed(2)}`;
      avgSpan.style.color = average >= 4.0 ? 'green' : 'red';
      
      header.appendChild(nameSpan);
      header.appendChild(avgSpan);
      panel.appendChild(header);
      
      // Count passing and failing courses
      const passing = courses.filter(c => c.numericGrade >= 4.0).length;
      const failing = courses.filter(c => c.numericGrade > 0 && c.numericGrade < 4.0).length;
      
      // Create simple status line
      const statusLine = document.createElement('div');
      statusLine.style.fontSize = '14px';
      statusLine.innerHTML = `<span style="color:green">✓ ${passing} passing</span> | <span style="color:red">✗ ${failing} failing</span> | ${courses.length} total courses`;
      panel.appendChild(statusLine);
      
      return panel;
    }
    
    function addDetailsSection(container, data) {
      // Create toggle button
      const toggleDiv = document.createElement('div');
      toggleDiv.style.textAlign = 'center';
      toggleDiv.style.marginBottom = '15px';
      
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'toggle-btn';
      toggleBtn.textContent = 'Show All Course Details';
      toggleBtn.style.backgroundColor = '#f2f2f2';
      toggleBtn.style.border = '1px solid #ddd';
      toggleBtn.style.borderRadius = '4px';
      toggleBtn.style.padding = '6px 12px';
      toggleBtn.style.cursor = 'pointer';
      toggleBtn.style.fontSize = '14px';
      
      toggleDiv.appendChild(toggleBtn);
      container.appendChild(toggleDiv);
      
      // Create details container (hidden by default)
      const detailsDiv = document.createElement('div');
      detailsDiv.id = 'details-section';
      detailsDiv.style.display = 'none';
      detailsDiv.style.marginTop = '15px';
      detailsDiv.style.border = '1px solid #eee';
      detailsDiv.style.borderRadius = '4px';
      detailsDiv.style.padding = '10px';
      
      // Add course details for each school
      if (data.inaCourses.length > 0) {
        addCourseDetails(detailsDiv, data.inaCourses, 'INA School Courses');
      }
      
      if (data.bmCourses.length > 0) {
        addCourseDetails(detailsDiv, data.bmCourses, 'BM School Courses');
      }
      
      if (data.otherCourses.length > 0) {
        addCourseDetails(detailsDiv, data.otherCourses, 'Other Courses');
      }
      
      container.appendChild(detailsDiv);
      
      // Toggle functionality
      toggleBtn.addEventListener('click', function() {
        if (detailsDiv.style.display === 'none') {
          detailsDiv.style.display = 'block';
          toggleBtn.textContent = 'Hide Course Details';
        } else {
          detailsDiv.style.display = 'none';
          toggleBtn.textContent = 'Show All Course Details';
        }
      });
    }
    
    function addCourseDetails(container, courses, title) {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'course-section';
      sectionDiv.style.marginBottom = '15px';
      
      // Add section title
      const sectionTitle = document.createElement('h3');
      sectionTitle.textContent = title;
      sectionTitle.style.fontSize = '15px';
      sectionTitle.style.marginTop = '10px';
      sectionTitle.style.marginBottom = '8px';
      sectionDiv.appendChild(sectionTitle);
      
      // Create table
      const table = document.createElement('table');
      
      // Table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      const courseHeader = document.createElement('th');
      courseHeader.textContent = 'Course';
      
      const gradeHeader = document.createElement('th');
      gradeHeader.textContent = 'Grade';
      
      const statusHeader = document.createElement('th');
      statusHeader.textContent = 'Status';
      
      headerRow.appendChild(courseHeader);
      headerRow.appendChild(gradeHeader);
      headerRow.appendChild(statusHeader);
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
        
        const statusCell = document.createElement('td');
        
        if (course.numericGrade >= 4.0) {
          statusCell.textContent = 'Pass';
          statusCell.style.color = 'green';
        } else if (course.numericGrade > 0) {
          statusCell.textContent = 'Fail';
          statusCell.style.color = 'red';
        } else {
          statusCell.textContent = '-';
        }
        
        row.appendChild(courseCell);
        row.appendChild(gradeCell);
        row.appendChild(statusCell);
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      sectionDiv.appendChild(table);
      container.appendChild(sectionDiv);
    }
    
    function addPromotionStatus(container, inaAverage, bmAverage, allCourses) {
      const promotionDiv = document.createElement('div');
      promotionDiv.className = 'promotion-status';
      promotionDiv.style.padding = '15px';
      promotionDiv.style.borderRadius = '4px';
      
      // Filter only courses with numeric grades
      const gradedCourses = allCourses.filter(course => course.numericGrade > 0);
      
      if (gradedCourses.length === 0) {
        const noGradesMsg = document.createElement('p');
        noGradesMsg.textContent = 'No graded courses found.';
        promotionDiv.appendChild(noGradesMsg);
        container.appendChild(promotionDiv);
        return;
      }
      //TODO: change the logic to 
      // Count failing grades and calculate deficit
      const failingCourses = gradedCourses.filter(course => course.numericGrade < 4.0);
      const gradeDeficit = failingCourses.reduce((sum, course) => sum + (4.0 - course.numericGrade), 0);
      
      // Calculate overall average
      const overallAverage = ((inaAverage > 0 ? inaAverage : 0) + (bmAverage > 0 ? bmAverage : 0)) / 
                            ((inaAverage > 0 ? 1 : 0) + (bmAverage > 0 ? 1 : 0));
      
      const avgMet = overallAverage >= 4.0;
      const deficitMet = gradeDeficit <= 2.0;
      const countMet = failingCourses.length <= 2;
      const isPromoted = avgMet && deficitMet && countMet;
      
      // Set the background color based on promotion status
      promotionDiv.style.backgroundColor = isPromoted ? '#dff0d8' : '#f2dede';
      promotionDiv.style.border = isPromoted ? '1px solid #d6e9c6' : '1px solid #ebccd1';
      
      // Create status header
      const statusHeader = document.createElement('div');
      statusHeader.style.display = 'flex';
      statusHeader.style.justifyContent = 'center';
      statusHeader.style.alignItems = 'center';
      statusHeader.style.marginBottom = '10px';
      
      const statusIcon = document.createElement('span');
      statusIcon.textContent = isPromoted ? '✓ ' : '✗ ';
      statusIcon.style.fontSize = '24px';
      statusIcon.style.marginRight = '10px';
      statusIcon.style.color = isPromoted ? '#3c763d' : '#a94442';
      
      const statusText = document.createElement('span');
      statusText.textContent = isPromoted ? 'PROMOTED' : 'NOT PROMOTED';
      statusText.style.fontSize = '20px';
      statusText.style.fontWeight = 'bold';
      statusText.style.color = isPromoted ? '#3c763d' : '#a94442';
      
      statusHeader.appendChild(statusIcon);
      statusHeader.appendChild(statusText);
      promotionDiv.appendChild(statusHeader);
      
      // Create compact summary of checks
      const checksDiv = document.createElement('div');
      checksDiv.style.fontSize = '13px';
      checksDiv.style.textAlign = 'center';
      checksDiv.style.marginTop = '10px';
      
      // Overall average
      const avgLine = document.createElement('div');
      avgLine.innerHTML = `Overall Average: <strong>${overallAverage.toFixed(2)}</strong> (min. 4.0) 
                        <span style="color:${avgMet ? 'green' : 'red'}">${avgMet ? '✓' : '✗'}</span>`;
      checksDiv.appendChild(avgLine);
      
      // Grade deficit
      const deficitLine = document.createElement('div');
      deficitLine.innerHTML = `Grade Deficit: <strong>${gradeDeficit.toFixed(2)}</strong> (max. 2.0) 
                            <span style="color:${deficitMet ? 'green' : 'red'}">${deficitMet ? '✓' : '✗'}</span>`;
      checksDiv.appendChild(deficitLine);
      
      // Failed courses count
      const countLine = document.createElement('div');
      countLine.innerHTML = `Failing Grades: <strong>${failingCourses.length}</strong> (max. 2) 
                          <span style="color:${countMet ? 'green' : 'red'}">${countMet ? '✓' : '✗'}</span>`;
      checksDiv.appendChild(countLine);
      
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
      return Math.round(grade * 2) / 2;
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