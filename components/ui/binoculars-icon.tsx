"use client";

import { motion } from "framer-motion";

interface BinocularsIconProps {
  className?: string;
  animate?: boolean;
}

export function BinocularsIcon({ className = "w-5 h-5", animate = true }: BinocularsIconProps) {
  return (
    <motion.img 
      whileHover={animate ? { scale: [1, 1.15, 1] } : undefined}
      transition={animate ? { duration: 0.6, repeat: Infinity, repeatType: "loop", ease: "easeInOut" } : undefined}
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAuCAYAAABXuSs3AAADNUlEQVR4AezWDW5TMRAE4JSLAScDTgacDPwVJrKD/94LilQ1Vaa2d2dnx/uiJB8ub/TvafzRD+458efENyfwrt8qnzaHdEs7W/eqc3bimn4vCr8Ksn4te/GyDF/y4WdVNywYJc4YT3Mr3R/+FXz5i7J0Xwwyqy41iOrE7bdxxrhGGnwr/14KPhdYnZnqmWA6dfigxlrKL+rgsvt31DgDaWBf93E2SXlvIWd7F4lpl8NJnb2Yczj2Sxw1HsE0yzmrCSbHCNPMy4u7jH0NMRfAgzo33B81zgwxzaw9yHkbMCPPsLO48wzRn3Fec0eMpzEjr8Wb/3KBGf2o5uWI8Vnje3MuB94qsNQ7YjyPMZNfih8kZOrpMy3fNR6zEZ+KnkyauNL/OvGtKeh6J7bN70y8nkAmf6e/YXme6HJQR4xH1EVcoMbQySBBA2oN53rizoPyy9anSm7/saj4RvSlIlZDnIlCmb6YUR/UGmK1Bu5QbDzxPyU9IVMx/XxL2mMz4QKjhrSYk6cBtYYzDVpgUNYuVsbrIsIaARPOVngpxFwg5kro+sKJKTwaUGs4y6XIBSHnZl0Zv22mUSNQHZhL49RJ24M9c3j2PcjhJJe6nK/rzDiREOt9Yr0Vz+VMCnCyupSc2Aw4uDiptW8wM573WESawsmhx2fGpSZlTQpXjWDX/Mx4CogQ2IWGUPN/1ofNfWrioymbGUe8NSD2KKR3nnzTd2W8Id9xiIkzEpl8Uzszrln3MTUK/UPq8gmRc5/dj05rZsYjNxUIqVrDd/GEu487ycVa61ypM+P5dBh+ll5V2k2Me8RpKgYtc3zygZC+0WjYM+MKQENCTeHggJeG9mh5uyQutkK4Gd4//Jlx5BQSihHxHuTx5FJn7/JgAH7L4In3gOMngxyNIXdlXEMChJhK4whqZK+ZPB6+mH1g6uLOePKgPqABzvrK43exMq6IQP0jSmNwCY3s04xBfHW3EK/Nq1Mf0FCDQ8d+iB3jKdaYIGEwFRALnMPvrTQyhFrDPho4vdomdsS4QsYIQxqJgfwu1EM07GnAlsZR41uijyA9jT9iynWP58TraTxif2bij/C17PFmjf8GAAD//zLjPjgAAAAGSURBVAMAjHqwXbmUDJoAAAAASUVORK5CYII=" 
      alt="Search" 
      className={className}
    />
  );
}
