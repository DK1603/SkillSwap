import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateLesson() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [place, setPlace] = useState('');
    const [date, setDate] = useState('');
    const [capacity, setCapacity] = useState('');
    const [duration, setDuration] = useState('');
    const [sessionType, setSessionType] = useState('in-person');
    const [difficultyLevel, setDifficultyLevel] = useState('beginner');
    const [skills, setSkills] = useState(['Skill 1', 'Skill 2']);

    const addSkill = () => {
        const skillText = skillInput.trim();
    
        if (skillText === '') {
            alert('Enter skill tag');
            return;
        }
        setSkills([...skills, skillText]);
        setSkillInput('');
    };

    const removeSkill = (index) => {
        setSkills(skills.filter((_, i) => i !== index));
    };

    const handleSkillInputKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    const formatDate = (value) => {
        let formatted = value.replace(/\D/g, '');
        if (formatted.length >= 4) {
            formatted = formatted.substring(0, 4) + '-' + formatted.substring(4);
        }
        if (formatted.length >= 7) {
            formatted = formatted.substring(0, 7) + '-' + formatted.substring(7, 9);
        }
        return formatted;
    };

    const handleDateChange = (e) => {
        const formattedDate = formatDate(e.target.value);
        setDate(formattedDate);
    };

    const saveLesson = () => {
        const formData = {
          title,
          description,
          place,
          date,
          capacity: parseInt(capacity),
          duration,
          sessionType,
          difficultyLevel,
          pointsCost: 5,
          skills
        };

        console.log('Lesson Data:', formData);
        alert('Lesson Created!');

        navigate('/dashboard');
    };

    const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: '1.2rem',
      fontWeight: 'normal',
      margin: 0
    },
    saveButton: {
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1.5rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem'
    },
    mainContainer: {
      display: 'flex',
      minHeight: 'calc(100vh - 60px)'
    },
    sidebar: {
      width: '200px',
      backgroundColor: '#ecf0f1',
      padding: '1rem'
    },
    sidebarItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.7rem 0',
      color: '#7f8c8d',
      cursor: 'pointer',
      borderBottom: '1px solid #bdc3c7'
    },
    sidebarItemActive: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.7rem 0',
      color: '#27ae60',
      fontWeight: 'bold',
      cursor: 'pointer',
      borderBottom: '1px solid #bdc3c7'
    },
    mainContent: {
      flex: 1,
      padding: '2rem',
      backgroundColor: 'white',
      margin: '1rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    sectionHeader: {
      color: '#bdc3c7',
      fontSize: '0.9rem',
      marginBottom: '0.5rem'
    },
    sectionTitle: {
      fontSize: '1.3rem',
      color: '#2c3e50',
      marginBottom: '2rem'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    formLabel: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#34495e',
      fontSize: '0.9rem'
    },
    formInput: {
      width: '100%',
      padding: '0.7rem',
      border: '1px solid #bdc3c7',
      borderRadius: '4px',
      fontSize: '0.9rem',
      backgroundColor: '#f8f9fa',
      boxSizing: 'border-box'
    },
    textArea: {
      width: '100%',
      padding: '0.7rem',
      border: '1px solid #bdc3c7',
      borderRadius: '4px',
      fontSize: '0.9rem',
      backgroundColor: '#f8f9fa',
      boxSizing: 'border-box',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    selectInput: {
      width: '100%',
      padding: '0.7rem',
      border: '1px solid #bdc3c7',
      borderRadius: '4px',
      fontSize: '0.9rem',
      backgroundColor: '#f8f9fa',
      boxSizing: 'border-box'
    },
    addSkillButton: {
      width: '100%',
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      padding: '0.8rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      marginTop: '1rem',
      marginBottom: '1rem'
    },
    skillHint: {
      color: '#95a5a6',
      fontSize: '0.8rem',
      marginTop: '0.5rem'
    },
    skillItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.7rem',
      border: '1px solid #bdc3c7',
      borderRadius: '4px',
      marginBottom: '0.5rem',
      backgroundColor: '#f8f9fa'
    },
    skillControls: {
      display: 'flex',
      gap: '0.5rem'
    },
    skillControl: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#7f8c8d',
      fontSize: '1rem'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Create Lesson</h1>
        <button 
          onClick={saveLesson}
          style={styles.saveButton}
          onMouseOver={(e) => e.target.style.backgroundColor = '#229954'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
        >
          Create
        </button>
      </header>

      <div style={styles.mainContainer}>

        {/* Main Content */}
        <main style={styles.mainContent}>
          <div style={styles.sectionHeader}>Lesson Creation</div>
          <h2 style={styles.sectionTitle}>Lesson Info</h2>

          {/* Title Input */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Lesson Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              style={styles.formInput}
              onFocus={(e) => {
                e.target.style.borderColor = '#27ae60';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#bdc3c7';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            />
          </div>
          
          {/* Description Input */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Lesson Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn in this session? Provide a brief description..."
              style={styles.textArea}
              onFocus={(e) => {
                e.target.style.borderColor = '#27ae60';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#bdc3c7';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            />
          </div>
          
          {/* Session Type */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Session type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              style={styles.selectInput}
              onFocus={(e) => {
                e.target.style.borderColor = '#27ae60';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#bdc3c7';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            >
              <option value="in-person">In-person</option>
              <option value="online">Online</option>
            </select>
          </div>

          {/* Difficulty Level */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Difficulty</label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              style={styles.selectInput}
              onFocus={(e) => {
                e.target.style.borderColor = '#27ae60';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#bdc3c7';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Capacity */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Maximum number of students (e.g., 5)"
              min="1"
              max="20"
              style={styles.formInput}
              onFocus={(e) => {
                e.target.style.borderColor = '#27ae60';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#bdc3c7';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            />
          </div>

          {/* Duration */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={styles.selectInput}
              onFocus={(e) => {
                e.target.style.borderColor = '#27ae60';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#bdc3c7';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            >
              <option value="">Choose duration</option>
              <option value="30min">30min</option>
              <option value="1hour">1hr</option>
              <option value="1.5hours">1hr 30min</option>
              <option value="2hours">2hr</option>
              <option value="3hours">3hr</option>
            </select>
          </div>

          {/* Skill Tag Input */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Skilltag</label>
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={handleSkillInputKeyPress}
              placeholder="ex) python"
              style={styles.formInput}
              onFocus={(e) => {
                e.target.style.borderColor = '#27ae60';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#bdc3c7';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            />
            <button
              type="button"
              onClick={addSkill}
              style={styles.addSkillButton}
              onMouseOver={(e) => e.target.style.backgroundColor = '#229954'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
            >
              Add
            </button>
            <div style={styles.skillHint}>write skills of this lesson</div>
          </div>

          {/* Skills List */}
          <div style={styles.formGroup}>
            {skills.map((skill, index) => (
              <div key={index} style={styles.skillItem}>
                <span style={{fontSize: '0.9rem'}}>{skill}</span>
                <div style={styles.skillControls}>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    style={styles.skillControl}
                    onMouseOver={(e) => e.target.style.color = '#2c3e50'}
                    onMouseOut={(e) => e.target.style.color = '#7f8c8d'}
                  >
                    🗑️
                  </button>
                  <button
                    type="button"
                    style={styles.skillControl}
                    onMouseOver={(e) => e.target.style.color = '#2c3e50'}
                    onMouseOut={(e) => e.target.style.color = '#7f8c8d'}
                  >
                    ☰
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Place Input */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Place</label>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Place"
              style={styles.formInput}
              onFocus={(e) => {
                e.target.style.borderColor = '#27ae60';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#bdc3c7';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            />
          </div>

          {/* Date Input */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Date</label>
            <input
              type="text"
              value={date}
              onChange={handleDateChange}
              placeholder="YYYY-MM-DD"
              style={styles.formInput}
              onFocus={(e) => {
                e.target.style.borderColor = '#27ae60';
                e.target.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#bdc3c7';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}