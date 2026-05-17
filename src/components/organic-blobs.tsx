"use client";

import { motion } from "framer-motion";

const blobPaths = [
  {
    initial:
      "M440,320Q430,390,370,430Q310,470,250,460Q190,450,140,410Q90,370,70,310Q50,250,60,180Q70,110,130,70Q190,30,250,40Q310,50,370,80Q430,110,445,180Q460,250,440,320Z",
    animate:
      "M450,310Q420,380,360,430Q300,480,240,460Q180,440,130,400Q80,360,60,290Q40,220,70,160Q100,100,160,60Q220,20,280,50Q340,80,390,120Q440,160,460,230Q480,300,450,310Z",
  },
  {
    initial:
      "M420,300Q400,370,340,420Q280,470,210,450Q140,430,100,370Q60,310,70,240Q80,170,120,110Q160,50,230,40Q300,30,360,70Q420,110,440,180Q460,250,420,300Z",
    animate:
      "M430,310Q410,380,350,430Q290,480,220,450Q150,420,110,360Q70,300,80,230Q90,160,140,100Q190,40,260,50Q330,60,380,110Q430,160,440,240Q450,320,430,310Z",
  },
  {
    initial:
      "M400,290Q390,350,340,400Q290,450,220,440Q150,430,110,380Q70,330,60,260Q50,190,100,130Q150,70,220,50Q290,30,350,70Q410,110,420,180Q430,250,400,290Z",
    animate:
      "M410,300Q400,370,340,420Q280,470,210,450Q140,430,100,370Q60,310,70,240Q80,170,130,110Q180,50,250,40Q320,30,370,80Q420,130,430,210Q440,290,410,300Z",
  },
];

const blobConfigs = [
  { size: 600, x: "10%", y: "5%", duration: 18, color: "var(--primary)", opacity: 0.08 },
  { size: 500, x: "55%", y: "20%", duration: 22, color: "var(--secondary)", opacity: 0.1 },
  { size: 450, x: "30%", y: "50%", duration: 15, color: "var(--muted)", opacity: 0.12 },
];

export function OrganicBlobs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {blobConfigs.map((config, i) => (
        <motion.svg
          key={i}
          width={config.size}
          height={config.size}
          viewBox="0 0 500 500"
          style={{
            position: "absolute",
            left: config.x,
            top: config.y,
            opacity: config.opacity,
          }}
          initial={{ scale: 0.9, x: 0, y: 0 }}
          animate={{
            scale: [0.9, 1.1, 0.95, 1.05, 0.9],
            x: [0, 20, -10, 15, 0],
            y: [0, -15, 10, -20, 0],
          }}
          transition={{
            duration: config.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.path
            d={blobPaths[i].initial}
            fill={config.color}
            initial={{ d: blobPaths[i].initial }}
            animate={{ d: [blobPaths[i].initial, blobPaths[i].animate, blobPaths[i].initial] }}
            transition={{
              duration: config.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.svg>
      ))}
    </div>
  );
}
