// WordPress-compatible Add-ons Component
// Select optional services and extras

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const { useState } = React;

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface AddOnsProps {
  state: any;
  actions: any;
}

export function AddOns({ state, actions }: AddOnsProps) {
  // Mock add-ons data - in real implementation, this would come from useAddOns hook
  const [availableAddOns] = useState<AddOn[]>([
    {
      id: 'surf-lesson-private',
      name: 'Private Surf Lesson',
      description: '2-hour private surf lesson with our expert instructors',
      price: 80,
      category: 'surf'
    },
    {
      id: 'surf-lesson-group',
      name: 'Group Surf Lesson',
      description: 'Group surf lesson with up to 4 participants',
      price: 40,
      category: 'surf'
    },
    {
      id: 'yoga-session',
      name: 'Beach Yoga Session',
      description: 'Relaxing 1-hour yoga session at sunrise',
      price: 25,
      category: 'wellness'
    },
    {
      id: 'airport-transfer',
      name: 'Airport Transfer',
      description: 'Round-trip airport transfer service',
      price: 45,
      category: 'transfer'
    },
    {
      id: 'massage',
      name: 'Relaxation Massage',
      description: '1-hour relaxation massage session',
      price: 60,
      category: 'wellness'
    },
    {
      id: 'meal-plan',
      name: 'Healthy Meal Plan',
      description: 'Nutritious meals throughout your stay',
      price: 35,
      category: 'food'
    }
  ]);

  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({});

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => {
      const newSelected = { ...prev };
      if (newSelected[addOnId]) {
        delete newSelected[addOnId];
      } else {
        newSelected[addOnId] = 1;
      }
      actions.setAddOns(Object.keys(newSelected));
      return newSelected;
    });
  };

  const updateQuantity = (addOnId: string, quantity: number) => {
    setSelectedAddOns(prev => ({
      ...prev,
      [addOnId]: Math.max(0, quantity)
    }));
  };

  const getTotalAddOnsPrice = () => {
    return Object.entries(selectedAddOns).reduce((total, [addOnId, quantity]) => {
      const addOn = availableAddOns.find(a => a.id === addOnId);
      return total + (addOn ? addOn.price * quantity : 0);
    }, 0);
  };

  const groupedAddOns = availableAddOns.reduce((groups, addOn) => {
    if (!groups[addOn.category]) {
      groups[addOn.category] = [];
    }
    groups[addOn.category].push(addOn);
    return groups;
  }, {} as Record<string, AddOn[]>);

  return React.createElement('div', { className: 'add-ons' }, [
    React.createElement('h3', {
      key: 'title',
      style: { fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }
    }, 'Enhance Your Experience'),
    
    React.createElement('p', {
      key: 'desc',
      style: { color: '#6b7280', marginBottom: '24px' }
    }, 'Add optional services to make your stay even better.'),
    
    React.createElement('div', {
      key: 'summary',
      style: { 
        marginBottom: '24px', 
        padding: '16px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, [
      React.createElement('span', {
        key: 'text',
        style: { fontWeight: '500' }
      }, `Selected add-ons: ${Object.keys(selectedAddOns).length}`),
      React.createElement('span', {
        key: 'price',
        style: { color: '#f97316', fontWeight: '600', fontSize: '18px' }
      }, `€${getTotalAddOnsPrice()}`)
    ]),
    
    React.createElement('div', {
      key: 'categories',
      style: { display: 'flex', flexDirection: 'column', gap: '24px' }
    }, Object.entries(groupedAddOns).map(([category, addOns]) => 
      React.createElement('div', { key: category }, [
        React.createElement('h4', {
          key: 'category-title',
          style: { 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#111827', 
            marginBottom: '16px',
            textTransform: 'capitalize'
          }
        }, category),
        
        React.createElement('div', {
          key: 'addons-list',
          style: { display: 'flex', flexDirection: 'column', gap: '12px' }
        }, addOns.map((addOn: AddOn) => {
          const isSelected = selectedAddOns[addOn.id] > 0;
          const quantity = selectedAddOns[addOn.id] || 0;
          
          return React.createElement('div', {
            key: addOn.id,
            style: { 
              padding: '16px',
              border: isSelected ? '2px solid #10b981' : '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: isSelected ? '#f0fdf4' : 'white',
              transition: 'all 0.2s'
            }
          }, [
            React.createElement('div', {
              key: 'header',
              style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }
            }, [
              React.createElement('div', {
                key: 'left',
                style: { flex: 1 }
              }, [
                React.createElement('h5', {
                  key: 'name',
                  style: { fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }
                }, addOn.name),
                React.createElement('p', {
                  key: 'desc',
                  style: { fontSize: '14px', color: '#6b7280', marginBottom: '8px' }
                }, addOn.description)
              ]),
              
              React.createElement('div', {
                key: 'right',
                style: { textAlign: 'right' }
              }, [
                React.createElement('span', {
                  key: 'price',
                  style: { color: '#f97316', fontWeight: '600', fontSize: '16px' }
                }, `€${addOn.price}`),
                isSelected && React.createElement('div', {
                  key: 'quantity-controls',
                  style: { marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }
                }, [
                  React.createElement('button', {
                    key: 'minus',
                    onClick: () => updateQuantity(addOn.id, quantity - 1),
                    disabled: quantity <= 1,
                    style: {
                      width: '24px',
                      height: '24px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }
                  }, '−'),
                  React.createElement('span', {
                    key: 'quantity',
                    style: { minWidth: '24px', textAlign: 'center', fontWeight: '500' }
                  }, quantity),
                  React.createElement('button', {
                    key: 'plus',
                    onClick: () => updateQuantity(addOn.id, quantity + 1),
                    style: {
                      width: '24px',
                      height: '24px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }
                  }, '+')
                ])
              ])
            ]),
            
            React.createElement('button', {
              key: 'toggle',
              onClick: () => toggleAddOn(addOn.id),
              style: {
                width: '100%',
                padding: '8px 16px',
                border: isSelected ? '2px solid #10b981' : '2px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: isSelected ? '#10b981' : 'white',
                color: isSelected ? 'white' : '#374151',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }
            }, isSelected ? '✓ Added to Booking' : '+ Add to Booking')
          ]);
        }))
      ])
    ))
  ]);
}
