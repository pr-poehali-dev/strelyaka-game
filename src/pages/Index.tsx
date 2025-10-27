import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

type Screen = 'menu' | 'map-select' | 'game' | 'shop' | 'stats';
type Map = 'warehouse' | 'city' | 'desert';

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  vx: number;
  vy: number;
  shootCooldown: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  isEnemy?: boolean;
}

interface Stats {
  damage: number;
  speed: number;
  maxHealth: number;
  fireRate: number;
}

interface Leaderboard {
  name: string;
  score: number;
  date: string;
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedMap, setSelectedMap] = useState<Map | null>(null);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [maxPlayerHealth, setMaxPlayerHealth] = useState(100);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 400, y: 300 });
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [balance, setBalance] = useState(1000);
  const [killCount, setKillCount] = useState(0);
  const [stats, setStats] = useState<Stats>({ damage: 25, speed: 5, maxHealth: 100, fireRate: 300 });
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([
    { name: 'Player1', score: 5000, date: '2025-10-27' },
    { name: 'Player2', score: 3500, date: '2025-10-27' },
    { name: 'Player3', score: 2000, date: '2025-10-26' }
  ]);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [canShoot, setCanShoot] = useState(true);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const bulletIdRef = useRef(0);
  const joystickRef = useRef<HTMLDivElement>(null);

  const startGame = (map: Map) => {
    setSelectedMap(map);
    setScreen('game');
    setPlayerHealth(stats.maxHealth);
    setMaxPlayerHealth(stats.maxHealth);
    setPlayerPos({ x: 400, y: 300 });
    setBullets([]);
    setKillCount(0);
    
    const newEnemies: Enemy[] = [];
    for (let i = 0; i < 4; i++) {
      newEnemies.push({
        id: i,
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        health: 100,
        maxHealth: 100,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        shootCooldown: 0
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const shootBullet = (targetX: number, targetY: number) => {
    if (!canShoot) return;
    
    const dx = targetX - playerPos.x;
    const dy = targetY - playerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const speed = 10;
    const bullet: Bullet = {
      id: bulletIdRef.current++,
      x: playerPos.x,
      y: playerPos.y,
      dx: (dx / distance) * speed,
      dy: (dy / distance) * speed,
      isEnemy: false
    };
    
    setBullets(prev => [...prev, bullet]);
    setCanShoot(false);
    setTimeout(() => setCanShoot(true), stats.fireRate);
  };

  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setJoystickActive(true);
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActive || !joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 40;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      setJoystickPos({
        x: Math.cos(angle) * maxDistance,
        y: Math.sin(angle) * maxDistance
      });
    } else {
      setJoystickPos({ x: dx, y: dy });
    }
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (screen !== 'game') return;

    const gameLoop = setInterval(() => {
      setPlayerPos(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const speed = stats.speed;

        if (keys.has('w') || keys.has('ц')) newY -= speed;
        if (keys.has('s') || keys.has('ы')) newY += speed;
        if (keys.has('a') || keys.has('ф')) newX -= speed;
        if (keys.has('d') || keys.has('в')) newX += speed;

        if (joystickActive) {
          newX += (joystickPos.x / 40) * speed;
          newY += (joystickPos.y / 40) * speed;
        }

        newX = Math.max(20, Math.min(780, newX));
        newY = Math.max(20, Math.min(580, newY));

        return { x: newX, y: newY };
      });

      setEnemies(prev => prev.map(enemy => {
        let newX = enemy.x + enemy.vx;
        let newY = enemy.y + enemy.vy;

        if (newX < 30 || newX > 770) enemy.vx *= -1;
        if (newY < 30 || newY > 570) enemy.vy *= -1;

        const dx = playerPos.x - enemy.x;
        const dy = playerPos.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 300 && distance > 100) {
          const moveSpeed = 1.5;
          newX += (dx / distance) * moveSpeed;
          newY += (dy / distance) * moveSpeed;
        }

        newX = Math.max(30, Math.min(770, newX));
        newY = Math.max(30, Math.min(570, newY));

        let newShootCooldown = enemy.shootCooldown - 50;
        
        if (newShootCooldown <= 0 && distance < 350) {
          const bulletSpeed = 6;
          const enemyBullet: Bullet = {
            id: bulletIdRef.current++,
            x: newX,
            y: newY,
            dx: (dx / distance) * bulletSpeed,
            dy: (dy / distance) * bulletSpeed,
            isEnemy: true
          };
          setBullets(b => [...b, enemyBullet]);
          newShootCooldown = 1500;
        }

        return { ...enemy, x: newX, y: newY, shootCooldown: newShootCooldown };
      }));

      setBullets(prev => 
        prev
          .map(b => ({ ...b, x: b.x + b.dx, y: b.y + b.dy }))
          .filter(b => b.x > 0 && b.x < 800 && b.y > 0 && b.y < 600)
      );

      setEnemies(prev => {
        let newEnemies = [...prev];
        
        setBullets(currentBullets => {
          const remainingBullets = currentBullets.filter(bullet => {
            if (bullet.isEnemy) {
              const dx = bullet.x - playerPos.x;
              const dy = bullet.y - playerPos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 20) {
                setPlayerHealth(h => Math.max(0, h - 15));
                return false;
              }
              return true;
            }
            
            let hit = false;
            newEnemies = newEnemies.map(enemy => {
              const dx = bullet.x - enemy.x;
              const dy = bullet.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 40) {
                hit = true;
                const newHealth = enemy.health - stats.damage;
                if (newHealth <= 0) {
                  setScore(s => s + 100);
                  setBalance(b => b + 50);
                  setKillCount(k => k + 1);
                }
                return { ...enemy, health: newHealth };
              }
              return enemy;
            });
            return !hit;
          });
          
          return remainingBullets;
        });

        return newEnemies.filter(e => e.health > 0);
      });

      setScore(s => s + 1);
    }, 50);

    return () => clearInterval(gameLoop);
  }, [screen, keys, joystickActive, joystickPos, playerPos, stats, canShoot]);

  useEffect(() => {
    if (playerHealth <= 0 && screen === 'game') {
      const finalScore = score;
      const newEntry = { name: 'You', score: finalScore, date: new Date().toISOString().split('T')[0] };
      setLeaderboard(prev => [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10));
      alert(`Game Over! Score: ${finalScore}`);
      setScreen('menu');
      setScore(0);
    }
    if (screen === 'game' && enemies.length === 0 && killCount > 0) {
      setScore(s => s + 500);
      const newEnemies: Enemy[] = [];
      for (let i = 0; i < Math.min(6, 4 + Math.floor(killCount / 4)); i++) {
        newEnemies.push({
          id: Date.now() + i,
          x: Math.random() * 700 + 50,
          y: Math.random() * 500 + 50,
          health: 100,
          maxHealth: 100,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          shootCooldown: 0
        });
      }
      setEnemies(newEnemies);
    }
  }, [playerHealth, enemies.length, screen, killCount, score]);

  const getMapColor = (map: Map) => {
    switch (map) {
      case 'warehouse': return 'bg-slate-800';
      case 'city': return 'bg-blue-950';
      case 'desert': return 'bg-amber-900';
    }
  };

  const upgradeStat = (stat: keyof Stats, cost: number) => {
    if (balance < cost) return;
    setBalance(b => b - cost);
    setStats(prev => {
      const newStats = { ...prev };
      if (stat === 'damage') newStats.damage += 10;
      if (stat === 'speed') newStats.speed += 1;
      if (stat === 'maxHealth') newStats.maxHealth += 25;
      if (stat === 'fireRate') newStats.fireRate = Math.max(100, newStats.fireRate - 50);
      return newStats;
    });
  };

  if (screen === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-red-950 to-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
        <Card className="p-8 md:p-12 text-center space-y-6 bg-card border-4 border-accent gold-glow">
          <h1 className="text-3xl md:text-5xl text-accent mb-4 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">PIXEL WARS</h1>
          
          <div className="flex items-center justify-center gap-3 text-accent text-sm md:text-base">
            <Icon name="Coins" className="text-accent" size={24} />
            <span>{balance}</span>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => setScreen('map-select')}
              className="w-full text-base md:text-xl px-8 py-6 bg-primary hover:bg-primary/80 border-4 border-accent text-accent red-glow"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              ИГРАТЬ
            </Button>

            <Button 
              onClick={() => setScreen('shop')}
              className="w-full text-sm md:text-lg px-6 py-4 bg-secondary hover:bg-secondary/80 border-4 border-secondary-foreground"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              <Icon name="ShoppingCart" size={20} className="mr-2" />
              МАГАЗИН
            </Button>

            <Button 
              onClick={() => setScreen('stats')}
              className="w-full text-sm md:text-lg px-6 py-4 bg-muted hover:bg-muted/80 border-4 border-foreground"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              <Icon name="TrendingUp" size={20} className="mr-2" />
              СТАТИСТИКА
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="w-full text-sm md:text-lg px-6 py-4 bg-accent hover:bg-accent/80 border-4 border-accent-foreground"
                  style={{ fontFamily: "'Press Start 2P', cursive" }}
                >
                  <Icon name="Trophy" size={20} className="mr-2" />
                  РЕКОРДЫ
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-4 border-accent" style={{ fontFamily: "'Press Start 2P', cursive" }}>
                <DialogHeader>
                  <DialogTitle className="text-accent text-center text-xl">ТАБЛИЦА РЕКОРДОВ</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-auto">
                  {leaderboard.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-muted border-2 border-border text-xs">
                      <span className="text-accent">#{idx + 1}</span>
                      <span>{entry.name}</span>
                      <span className="text-accent">{entry.score}</span>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={() => {
                const referralLink = `${window.location.origin}/?ref=player`;
                navigator.clipboard.writeText(referralLink);
                alert('Реферальная ссылка скопирована!');
              }}
              className="w-full text-sm md:text-lg px-6 py-4 bg-green-700 hover:bg-green-600 border-4 border-green-400"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              <Icon name="Users" size={20} className="mr-2" />
              ПРИГЛАСИТЬ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (screen === 'stats') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-red-950 to-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
        <Card className="p-8 space-y-6 bg-card border-4 border-accent gold-glow max-w-2xl w-full">
          <h2 className="text-2xl md:text-3xl text-center text-accent">СТАТИСТИКА</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted border-2 border-accent">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">УРОН: {stats.damage}</span>
                <Button 
                  onClick={() => upgradeStat('damage', 200)}
                  disabled={balance < 200}
                  size="sm"
                  className="bg-accent hover:bg-accent/80 text-accent-foreground"
                  style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}
                >
                  +10 (200💰)
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted border-2 border-accent">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">СКОРОСТЬ: {stats.speed}</span>
                <Button 
                  onClick={() => upgradeStat('speed', 150)}
                  disabled={balance < 150}
                  size="sm"
                  className="bg-accent hover:bg-accent/80 text-accent-foreground"
                  style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}
                >
                  +1 (150💰)
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted border-2 border-accent">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">ЗДОРОВЬЕ: {stats.maxHealth}</span>
                <Button 
                  onClick={() => upgradeStat('maxHealth', 250)}
                  disabled={balance < 250}
                  size="sm"
                  className="bg-accent hover:bg-accent/80 text-accent-foreground"
                  style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}
                >
                  +25 (250💰)
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted border-2 border-accent">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">ПЕРЕЗАРЯДКА: {stats.fireRate}ms</span>
                <Button 
                  onClick={() => upgradeStat('fireRate', 300)}
                  disabled={balance < 300 || stats.fireRate <= 100}
                  size="sm"
                  className="bg-accent hover:bg-accent/80 text-accent-foreground"
                  style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}
                >
                  -50ms (300💰)
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <div className="text-accent text-xl mb-4">💰 Баланс: {balance}</div>
            <Button 
              onClick={() => setScreen('menu')}
              variant="outline"
              className="border-2 border-accent text-accent"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              НАЗАД
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (screen === 'shop') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-red-950 to-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
        <Card className="p-8 space-y-6 bg-card border-4 border-accent gold-glow max-w-4xl w-full">
          <h2 className="text-2xl md:text-3xl text-center text-accent">МАГАЗИН</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-muted border-4 border-accent hover:scale-105 transition-transform">
              <div className="text-center space-y-3">
                <div className="text-6xl">🏰</div>
                <h3 className="text-lg text-accent">БАЗА LVL 1</h3>
                <p className="text-xs text-muted-foreground">+50 HP рождения</p>
                <Button 
                  className="w-full bg-accent hover:bg-accent/80 text-accent-foreground"
                  style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}
                  onClick={() => {
                    if (balance >= 500) {
                      setBalance(b => b - 500);
                      alert('База куплена!');
                    }
                  }}
                  disabled={balance < 500}
                >
                  500💰
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-muted border-4 border-accent hover:scale-105 transition-transform">
              <div className="text-center space-y-3">
                <div className="text-6xl">🏯</div>
                <h3 className="text-lg text-accent">БАЗА LVL 2</h3>
                <p className="text-xs text-muted-foreground">+100 HP рождения</p>
                <Button 
                  className="w-full bg-accent hover:bg-accent/80 text-accent-foreground"
                  style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}
                  onClick={() => {
                    if (balance >= 1200) {
                      setBalance(b => b - 1200);
                      alert('База куплена!');
                    }
                  }}
                  disabled={balance < 1200}
                >
                  1200💰
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-muted border-4 border-primary hover:scale-105 transition-transform">
              <div className="text-center space-y-3">
                <div className="text-6xl">🚗</div>
                <h3 className="text-lg text-primary">ЛЕГКИЙ ТАНК</h3>
                <p className="text-xs text-muted-foreground">+2 скорость, +20 урон</p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
                  style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}
                  onClick={() => {
                    if (balance >= 800) {
                      setBalance(b => b - 800);
                      setStats(s => ({ ...s, speed: s.speed + 2, damage: s.damage + 20 }));
                      alert('Танк куплен!');
                    }
                  }}
                  disabled={balance < 800}
                >
                  800💰
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-muted border-4 border-primary hover:scale-105 transition-transform">
              <div className="text-center space-y-3">
                <div className="text-6xl">🚜</div>
                <h3 className="text-lg text-primary">ТЯЖЕЛЫЙ ТАНК</h3>
                <p className="text-xs text-muted-foreground">+50 урон, +100 HP</p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
                  style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '10px' }}
                  onClick={() => {
                    if (balance >= 1500) {
                      setBalance(b => b - 1500);
                      setStats(s => ({ ...s, damage: s.damage + 50, maxHealth: s.maxHealth + 100 }));
                      alert('Танк куплен!');
                    }
                  }}
                  disabled={balance < 1500}
                >
                  1500💰
                </Button>
              </div>
            </Card>
          </div>

          <div className="text-center pt-4">
            <div className="text-accent text-xl mb-4">💰 Баланс: {balance}</div>
            <Button 
              onClick={() => setScreen('menu')}
              variant="outline"
              className="border-2 border-accent text-accent"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              НАЗАД
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (screen === 'map-select') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-black via-red-950 to-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
        <div className="space-y-6 md:space-y-8">
          <h2 className="text-2xl md:text-3xl text-center text-accent drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">ВЫБЕРИ КАРТУ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {(['warehouse', 'city', 'desert'] as Map[]).map(map => (
              <Card 
                key={map}
                className="p-4 md:p-6 cursor-pointer hover:border-accent border-4 transition-all hover:scale-105 bg-card gold-glow"
                onClick={() => startGame(map)}
              >
                <div className={`w-36 h-36 md:w-48 md:h-48 ${getMapColor(map)} border-4 border-accent mb-4 flex items-center justify-center text-5xl md:text-6xl`}>
                  {map === 'warehouse' && '🏭'}
                  {map === 'city' && '🏙️'}
                  {map === 'desert' && '🏜️'}
                </div>
                <p className="text-center text-xs md:text-sm uppercase text-accent">{map}</p>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button 
              onClick={() => setScreen('menu')}
              variant="outline"
              className="border-2 border-accent text-accent"
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
    <div className="min-h-screen flex items-center justify-center p-2 md:p-4 bg-gradient-to-br from-black via-red-950 to-black" style={{ fontFamily: "'Press Start 2P', cursive" }}>
      <div className="space-y-3 md:space-y-4 w-full max-w-[850px]">
        <div className="flex flex-wrap justify-between items-center text-xs md:text-sm gap-2">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-accent">HP: {Math.floor(playerHealth)}/{maxPlayerHealth}</span>
            <div className="w-32 md:w-48 h-4 md:h-6 bg-muted border-2 border-accent">
              <div 
                className="h-full bg-primary transition-all red-glow"
                style={{ width: `${(playerHealth / maxPlayerHealth) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-accent">SCORE: {score}</span>
          <span className="text-primary">KILLS: {killCount}</span>
        </div>
        
        <div 
          ref={gameRef}
          className={`w-full aspect-[4/3] max-w-[800px] max-h-[600px] ${selectedMap ? getMapColor(selectedMap) : 'bg-slate-800'} border-4 border-accent relative overflow-hidden cursor-crosshair gold-glow`}
          onClick={(e) => {
            if (!gameRef.current) return;
            const rect = gameRef.current.getBoundingClientRect();
            shootBullet(e.clientX - rect.left, e.clientY - rect.top);
          }}
        >
          <div 
            className="absolute w-8 h-8 md:w-10 md:h-10 bg-accent border-2 border-accent-foreground transition-all"
            style={{ 
              left: `${playerPos.x - 20}px`, 
              top: `${playerPos.y - 20}px`,
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
            }}
          />

          {enemies.map(enemy => (
            <div 
              key={enemy.id}
              className="absolute w-10 h-10 md:w-12 md:h-12 bg-primary border-2 border-primary-foreground"
              style={{ 
                left: `${enemy.x - 20}px`, 
                top: `${enemy.y - 20}px`,
              }}
            >
              <div className="w-full h-1 bg-muted mt-[-6px]">
                <div 
                  className="h-full bg-primary red-glow"
                  style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                />
              </div>
            </div>
          ))}

          {bullets.map(bullet => (
            <div 
              key={bullet.id}
              className={`absolute w-2 h-2 md:w-3 md:h-3 ${bullet.isEnemy ? 'bg-red-500 border border-red-300' : 'bg-yellow-400 border border-yellow-200'}`}
              style={{ 
                left: `${bullet.x}px`, 
                top: `${bullet.y}px`,
              }}
            />
          ))}

          <div className="absolute bottom-4 left-4 md:hidden">
            <div 
              ref={joystickRef}
              className="w-24 h-24 bg-muted/50 border-4 border-accent rounded-full flex items-center justify-center"
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
              onMouseDown={handleJoystickStart}
              onMouseMove={handleJoystickMove}
              onMouseUp={handleJoystickEnd}
              onMouseLeave={handleJoystickEnd}
            >
              <div 
                className="w-10 h-10 bg-accent rounded-full transition-transform"
                style={{ 
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)` 
                }}
              />
            </div>
          </div>

          <div className="absolute bottom-4 right-4 md:hidden">
            <Button
              className="w-20 h-20 rounded-full bg-primary hover:bg-primary/80 border-4 border-accent text-2xl"
              onTouchStart={(e) => {
                e.preventDefault();
                shootBullet(playerPos.x + 100, playerPos.y);
              }}
              onClick={(e) => {
                e.stopPropagation();
                shootBullet(playerPos.x + 100, playerPos.y);
              }}
            >
              🔫
            </Button>
          </div>
        </div>

        <div className="text-center text-xs space-y-2">
          <p className="text-accent hidden md:block">WASD - движение | ЛКМ - стрелять</p>
          <p className="text-accent md:hidden">🕹️ Джойстик - движение | 🔫 - стрелять</p>
          <Button 
            onClick={() => setScreen('menu')}
            variant="outline"
            className="border-2 border-accent text-accent"
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