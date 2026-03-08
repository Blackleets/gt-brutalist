import { motion } from "framer-motion";

interface IconProps {
    className?: string;
}

export const MetaMaskIcon = ({ className }: IconProps) => (
    <motion.svg
        viewBox="0 0 318.6 318.6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-10 h-10 drop-shadow-md ${className || ""}`}
        initial={{ filter: "drop-shadow(0 0 0px #F6851B)" }}
        whileHover={{ filter: "drop-shadow(0 0 8px #F6851B)", scale: 1.05 }}
    >
        <path fill="#e2761b" stroke="#e2761b" strokeLinecap="round" strokeLinejoin="round" d="m274.1 35.5-99.5 73.9L193 65.8z" />
        <path d="m44.4 35.5 98.7 74.6-17.5-44.3zm193.9 171.3-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9L50.1 263l56.7-15.6-26.5-40.6z" fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m103.6 138.2-15.8 23.9 56.3 2.5-2-60.5zm111.3 0-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5 33.9 16.5-4.7-39.3z" fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" />
        <path fill="#d7c1b3" stroke="#d7c1b3" strokeLinecap="round" strokeLinejoin="round" d="m211.8 247.4-33.9-16.5 2.7 22.1-.3 9.3zm-105 0 31.5 14.9-.2-9.3 2.5-22.1z" />
        <path fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" d="m138.8 193.5-28.2-8.3 19.9-9.1zm40.9 0 8.3-17.4 20 9.1z" />
        <path fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round" d="m106.8 247.4 4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1 20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z" />
        <path fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round" d="m87.8 162.1 23.6 46-.8-22.9zm120.3 23.1-1 22.9 23.7-46zm-64-20.6-5.3 28.9 6.6 34.1 1.5-44.9zm30.5 0-2.7 18 1.2 45 6.7-34.1z" />
        <path d="m179.8 193.5-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zm-69.2-8.3.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z" fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" />
        <path fill="#c0ad9e" stroke="#c0ad9e" strokeLinecap="round" strokeLinejoin="round" d="m180.3 262.3.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z" />
        <path fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" d="m177.9 230.9-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z" />
        <path fill="#763d16" stroke="#763d16" strokeLinecap="round" strokeLinejoin="round" d="m278.3 114.2 8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z" />
        <path d="m267.2 153.5-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zm-163.6-15.3-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zm71 26.4 3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z" fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
);

export const PhantomIcon = ({ className }: IconProps) => (
    <motion.svg
        viewBox="0 0 108 108"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-10 h-10 ${className || ""}`}
        initial={{ filter: "drop-shadow(0 0 0px #AB9FF2)" }}
        whileHover={{ filter: "drop-shadow(0 0 8px #AB9FF2)" }}
    >
        <rect width="108" height="108" rx="26" fill="#AB9FF2" />
        <path fillRule="evenodd" clipRule="evenodd" d="M46.5267 69.9229C42.0054 76.8509 34.4292 85.6182 24.348 85.6182C19.5824 85.6182 15 83.6563 15 75.1342C15 53.4305 44.6326 19.8327 72.1268 19.8327C87.768 19.8327 94 30.6846 94 43.0079C94 58.8258 83.7355 76.9122 73.5321 76.9122C70.2939 76.9122 68.7053 75.1342 68.7053 72.314C68.7053 71.5783 68.8275 70.7812 69.0719 69.9229C65.5893 75.8699 58.8685 81.3878 52.5754 81.3878C47.993 81.3878 45.6713 78.5063 45.6713 74.4598C45.6713 72.9884 45.9768 71.4556 46.5267 69.9229ZM83.6761 42.5794C83.6761 46.1704 81.5575 47.9658 79.1875 47.9658C76.7816 47.9658 74.6989 46.1704 74.6989 42.5794C74.6989 38.9885 76.7816 37.1931 79.1875 37.1931C81.5575 37.1931 83.6761 38.9885 83.6761 42.5794ZM70.2103 42.5795C70.2103 46.1704 68.0916 47.9658 65.7216 47.9658C63.3157 47.9658 61.233 46.1704 61.233 42.5795C61.233 38.9885 63.3157 37.1931 65.7216 37.1931C68.0916 37.1931 70.2103 38.9885 70.2103 42.5795Z" fill="#FFFDF8" />
    </motion.svg>
);

export const SolflareIcon = ({ className }: IconProps) => (
    <motion.svg
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-10 h-10 ${className || ""}`}
        initial={{ opacity: 0.9 }}
        whileHover={{ filter: "drop-shadow(0 0 8px #ffef46)", scale: 1.05 }}
    >
        <rect fill="#ffef46" x="0" width="50" height="50" rx="12" ry="12" />
        <path fill="#02050a" stroke="#ffef46" strokeMiterlimit="10" strokeWidth="0.5" d="M24.23,26.42l2.46-2.38,4.59,1.5c3.01,1,4.51,2.84,4.51,5.43,0,1.96-.75,3.26-2.25,4.93l-.46.5.17-1.17c.67-4.26-.58-6.09-4.72-7.43l-4.3-1.38h0ZM18.05,11.85l12.52,4.17-2.71,2.59-6.51-2.17c-2.25-.75-3.01-1.96-3.3-4.51v-.08h0ZM17.3,33.06l2.84-2.71,5.34,1.75c2.8.92,3.76,2.13,3.46,5.18l-11.65-4.22h0ZM13.71,20.95c0-.79.42-1.54,1.13-2.17.75,1.09,2.05,2.05,4.09,2.71l4.42,1.46-2.46,2.38-4.34-1.42c-2-.67-2.84-1.67-2.84-2.96M26.82,42.87c9.18-6.09,14.11-10.23,14.11-15.32,0-3.38-2-5.26-6.43-6.72l-3.34-1.13,9.14-8.77-1.84-1.96-2.71,2.38-12.81-4.22c-3.97,1.29-8.97,5.09-8.97,8.89,0,.42.04.83.17,1.29-3.3,1.88-4.63,3.63-4.63,5.8,0,2.05,1.09,4.09,4.55,5.22l2.75.92-9.52,9.14,1.84,1.96,2.96-2.71,14.73,5.22h0Z" />
    </motion.svg>
);

export const BinanceIcon = ({ className }: IconProps) => (
    <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        className={`w-10 h-10 ${className || ""}`}
        whileHover={{ scale: 1.1, filter: "drop-shadow(0 0 8px #F3BA2F)" }}
    >
        <path d="M12 21L10.2 19.2L12 17.4L13.8 19.2L12 21Z" fill="#F3BA2F" />
        <path d="M15.8 17.2L14 15.4L15.8 13.6L17.6 15.4L15.8 17.2Z" fill="#F3BA2F" />
        <path d="M8.2 17.2L6.4 15.4L8.2 13.6L10 15.4L8.2 17.2Z" fill="#F3BA2F" />
        <path d="M12 13.4L10.2 11.6L12 9.8L13.8 11.6L12 13.4Z" fill="#F3BA2F" />
        <path d="M19.6 13.4L17.8 11.6L19.6 9.8L21.4 11.6L19.6 13.4Z" fill="#F3BA2F" />
        <path d="M4.4 13.4L2.6 11.6L4.4 9.8L6.2 11.6L4.4 13.4Z" fill="#F3BA2F" />
        <path d="M15.8 9.6L14 7.8L15.8 6L17.6 7.8L15.8 9.6Z" fill="#F3BA2F" />
        <path d="M8.2 9.6L6.4 7.8L8.2 6L10 7.8L8.2 9.6Z" fill="#F3BA2F" />
        <path d="M12 5.6L10.2 3.8L12 2L13.8 3.8L12 5.6Z" fill="#F3BA2F" />
    </motion.svg>
);

export const OKXIcon = ({ className }: IconProps) => (
    <div
        className={`w-10 h-10 bg-black text-white flex items-center justify-center font-black rounded-lg text-[10px] border-2 border-zinc-800 ${className || ""}`}
    >
        OKX
    </div>
);

export const WalletConnectIcon = ({ className }: IconProps) => (
    <motion.svg
        viewBox="0 0 400 400"
        fill="none"
        className={`w-10 h-10 drop-shadow-md ${className || ""}`}
        whileHover={{ scale: 1.05, filter: "drop-shadow(0 0 8px rgba(51,150,255,0.6))" }}
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="200" cy="200" fill="#3396ff" r="199.5" stroke="#66b1ff" />
        <path d="m122.519 148.965c42.791-41.729 112.171-41.729 154.962 0l5.15 5.022c2.14 2.086 2.14 5.469 0 7.555l-17.617 17.18c-1.07 1.043-2.804 1.043-3.874 0l-7.087-6.911c-29.853-29.111-78.253-29.111-108.106 0l-7.59 7.401c-1.07 1.043-2.804 1.043-3.874 0l-17.617-17.18c-2.14-2.086-2.14-5.469 0-7.555zm191.397 35.529 15.679 15.29c2.14 2.086 2.14 5.469 0 7.555l-70.7 68.944c-2.139 2.087-5.608 2.087-7.748 0l-50.178-48.931c-.535-.522-1.402-.522-1.937 0l-50.178 48.931c-2.139 2.087-5.608 2.087-7.748 0l-70.7015-68.945c-2.1396-2.086-2.1396-5.469 0-7.555l15.6795-15.29c2.1396-2.086 5.6085-2.086 7.7481 0l50.1789 48.932c.535.522 1.402.522 1.937 0l50.177-48.932c2.139-2.087 5.608-2.087 7.748 0l50.179 48.932c.535.522 1.402.522 1.937 0l50.179-48.931c2.139-2.087 5.608-2.087 7.748 0z" fill="#fff" />
    </motion.svg>
);
