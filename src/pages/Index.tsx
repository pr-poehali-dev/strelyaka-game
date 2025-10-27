import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Screen = 'menu' | 'map-select' | 'game';
type Map = 'warehouse' | 'city' | 'desert';

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedMap, setSelectedMap] = useState<Map | null>(null);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 400, y: 300 });
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const gameRef = useRef<HTMLDivElement>(null);
  const bulletIdRef = useRef(0);

  const startGame = (map: Map) => {
    setSelectedMap(map);
    setScreen('game');
    setPlayerHealth(100);
    setPlayerPos({ x: 400, y: 300 });
    setBullets([]);
    
    const newEnemies: Enemy[] = [];
    for (let i = 0; i < 4; i++) {
      newEnemies.push({
        id: i,
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        health: 100
      });
    }
    setEnemies(newEnemies);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.key.toLowerCase()));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };

    const handleClick = (e: MouseEvent) => {
      if (screen !== 'game' || !gameRef.current) return;
      
      const rect = gameRef.current.getBoundingClientRect();
      const targetX = e.clientX - rect.left;
      const targetY = e.clientY - rect.top;
      
      const dx = targetX - playerPos.x;
      const dy = targetY - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const speed = 10;
      const bullet: Bullet = {
        id: bulletIdRef.current++,
        x: playerPos.x,
        y: playerPos.y,
        dx: (dx / distance) * speed,
        dy: (dy / distance) * speed
      };
      
      setBullets(prev => [...prev, bullet]);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('click', handleClick);
    };
  }, [screen, playerPos]);

  useEffect(() => {
    if (screen !== 'game') return;

    const gameLoop = setInterval(() => {
      setPlayerPos(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const speed = 5;

        if (keys.has('w') || keys.has('ц')) newY -= speed;
        if (keys.has('s') || keys.has('ы')) newY += speed;
        if (keys.has('a') || keys.has('ф')) newX -= speed;
        if (keys.has('d') || keys.has('в')) newX += speed;

        newX = Math.max(20, Math.min(780, newX));
        newY = Math.max(20, Math.min(580, newY));

        return { x: newX, y: newY };
      });

      setBullets(prev => 
        prev
          .map(b => ({ ...b, x: b.x + b.dx, y: b.y + b.dy }))
          .filter(b => b.x > 0 && b.x < 800 && b.y > 0 && b.y < 600)
      );

      setEnemies(prev => {
        let newEnemies = [...prev];
        
        setBullets(currentBullets => {
          const remainingBullets = currentBullets.filter(bullet => {
            let hit = false;
            newEnemies = newEnemies.map(enemy => {
              const dx = bullet.x - enemy.x;
              const dy = bullet.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 30) {
                hit = true;
                return { ...enemy, health: enemy.health - 25 };
              }
              return enemy;
            });
            return !hit;
          });
          
          return remainingBullets;
        });

        return newEnemies.filter(e => e.health > 0);
      });

      setPlayerHealth(prev => Math.max(0, prev - 0.10));
    }, 50);

    return () => clearInterval(gameLoop);
  }, [screen, keys]);

  useEffect(() => {
    if (playerHealth <= 0) {
      alert('Game Over!');
      setScreen('menu');
    }
    if (screen === 'game' && enemies.length === 0) {
      alert('Victory!');
      setScreen('menu');
    }
  }, [playerHealth, enemies.length, screen]);

  const getMapColor = (map: Map) => {
    switch (map) {
      case 'warehouse': return 'bg-slate-700';
      case 'city': return 'bg-blue-900';
      case 'desert': return 'bg-yellow-800';
    }
  };

  if (screen === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: "'Press Start 2P', cursive" }}>
        <Card className="p-12 text-center space-y-8 bg-card border-4 border-primary">
          <h1 className="text-4xl text-primary mb-8 pixel-text">PIXEL SHOOTER</h1>
          <Button 
            onClick={() => setScreen('map-select')}
            className="text-xl px-12 py-8 bg-primary hover:bg-primary/80 border-4 border-primary-foreground"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            ИГРАТЬ
          </Button>
        </Card>
      </div>
    );
  }

  if (screen === 'map-select') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ fontFamily: "'Press Start 2P', cursive" }}>
        <div className="space-y-8">
          <h2 className="text-3xl text-center text-primary">ВЫБЕРИ КАРТУ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['warehouse', 'city', 'desert'] as Map[]).map(map => (
              <Card 
                key={map}
                className="p-6 cursor-pointer hover:border-primary border-4 transition-all hover:scale-105"
                onClick={() => startGame(map)}
              >
                <div className={`w-48 h-48 ${getMapColor(map)} border-4 border-foreground mb-4 flex items-center justify-center text-6xl`}>
                  {map === 'warehouse' && '🏭'}
                  {map === 'city' && '🏙️'}
                  {map === 'desert' && '🏜️'}
                </div>
                <p className="text-center text-sm uppercase">{map}</p>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button 
              onClick={() => setScreen('menu')}
              variant="outline"
              className="border-2"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              НАЗАД
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ fontFamily: "'Press Start 2P', cursive" }}>
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <span>HP: {Math.floor(playerHealth)}</span>
            <div className="w-48 h-6 bg-muted border-2 border-foreground">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${playerHealth}%` }}
              />
            </div>
          </div>
          <span>ENEMIES: {enemies.length}/4</span>
        </div>
        
        <div 
          ref={gameRef}
          className={`w-[800px] h-[600px] ${selectedMap ? getMapColor(selectedMap) : 'bg-slate-700'} border-4 border-foreground relative overflow-hidden cursor-crosshair`}
        >
          <div 
            className="absolute w-8 h-8 bg-primary border-2 border-foreground transition-all"
            style={{ 
              left: `${playerPos.x - 16}px`, 
              top: `${playerPos.y - 16}px`,
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
            }}
          />

          {enemies.map(enemy => (
            <div 
              key={enemy.id}
              className="absolute w-8 h-8 bg-destructive border-2 border-foreground"
              style={{ 
                left: `${enemy.x - 16}px`, 
                top: `${enemy.y - 16}px`,
              }}
            >
              <div className="w-full h-1 bg-muted mt-[-6px]">
                <div 
                  className="h-full bg-destructive"
                  style={{ width: `${enemy.health}%` }}
                />
              </div>
            </div>
          ))}

          {bullets.map(bullet => (
            <div 
              key={bullet.id}
              className="absolute w-2 h-2 bg-yellow-400 border border-yellow-200"
              style={{ 
                left: `${bullet.x}px`, 
                top: `${bullet.y}px`,
              }}
            />
          ))}
        </div>

        <div className="text-center text-xs space-y-2">
          <p>WASD - движение | ЛКМ - стрелять</p>
          <Button 
            onClick={() => setScreen('menu')}
            variant="outline"
            className="border-2"
            size="sm"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            ВЫХОД
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
