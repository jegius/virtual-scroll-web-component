import './App.css';
import {useMemo} from 'react';

function App() {
  const items = useMemo(() => {
    const items = [];
    for (let i = 0; i < 1000000; i++) {
      items.push(i);
    }
    return items;
  }, []);

  return (
    <div className="App">
     <virtual-scroll>
        {items.map((item, index) => (
            <div key={index} style={{height: '100px', border: '1px solid black'}}>{item}</div>
        ))}
     </virtual-scroll>
    </div>
  );
}

export default App;
