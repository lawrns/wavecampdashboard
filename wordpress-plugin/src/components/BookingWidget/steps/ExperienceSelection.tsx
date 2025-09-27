// WordPress-compatible Experience Selection Component
// First step: Choose between Room booking or Surf Week

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const { useState } = React;

interface ExperienceSelectionProps {
  state: any;
  actions: any;
}

export function ExperienceSelection({ state, actions }: ExperienceSelectionProps) {
  return React.createElement('div', { className: 'experience-selection' }, [
    React.createElement('h3', {
      key: 'title',
      style: { fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }
    }, 'Choose Your Adventure'),
    
    React.createElement('p', {
      key: 'desc',
      style: { color: '#6b7280', marginBottom: '24px' }
    }, 'How would you like to experience Heiwa House?'),
    
    React.createElement('div', {
      key: 'options',
      style: { display: 'grid', gap: '16px' }
    }, [
      React.createElement('button', {
        key: 'room',
        onClick: () => actions.setExperienceType('room'),
        style: {
          padding: '20px',
          border: state.experienceType === 'room' ? '2px solid #f97316' : '2px solid #d1d5db',
          borderRadius: '8px',
          backgroundColor: state.experienceType === 'room' ? '#fff7ed' : 'white',
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }
      }, [
        React.createElement('div', {
          key: 'header',
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }
        }, [
          React.createElement('h4', {
            key: 'title',
            style: { fontSize: '18px', fontWeight: '600', color: '#111827' }
          }, 'Book a Room'),
          React.createElement('span', {
            key: 'price',
            style: { color: '#f97316', fontWeight: '600' }
          }, 'From €45')
        ]),
        React.createElement('p', {
          key: 'desc',
          style: { color: '#6b7280', marginBottom: '12px' }
        }, 'Choose your dates and accommodation. Perfect for flexible stays.'),
        React.createElement('div', {
          key: 'features',
          style: { display: 'flex', gap: '12px', fontSize: '14px', color: '#6b7280' }
        }, ['🏠 Flexible dates', '🛏️ Choose your room', '🏄 Self-guided experience'].map(feature =>
          React.createElement('span', { key: feature }, feature)
        ))
      ]),
      
      React.createElement('button', {
        key: 'surf-week',
        onClick: () => actions.setExperienceType('surf-week'),
        style: {
          padding: '20px',
          border: state.experienceType === 'surf-week' ? '2px solid #f97316' : '2px solid #d1d5db',
          borderRadius: '8px',
          backgroundColor: state.experienceType === 'surf-week' ? '#fff7ed' : 'white',
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }
      }, [
        React.createElement('div', {
          key: 'header',
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }
        }, [
          React.createElement('h4', {
            key: 'title',
            style: { fontSize: '18px', fontWeight: '600', color: '#111827' }
          }, 'All-Inclusive Surf Week'),
          React.createElement('span', {
            key: 'price',
            style: { color: '#f97316', fontWeight: '600' }
          }, 'From €599')
        ]),
        React.createElement('p', {
          key: 'desc',
          style: { color: '#6b7280', marginBottom: '12px' }
        }, 'Join our structured surf camp programs with coaching and community.'),
        React.createElement('div', {
          key: 'features',
          style: { display: 'flex', gap: '12px', fontSize: '14px', color: '#6b7280' }
        }, ['🏄 Professional coaching', '🍽️ All meals included', '📅 Structured program'].map(feature =>
          React.createElement('span', { key: feature }, feature)
        ))
      ])
    ])
  ]);
}
