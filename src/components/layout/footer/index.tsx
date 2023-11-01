import DarkModeButton from "../dark-mode-button";
import GithubMark from "@/../public/assets/github-mark.svg";
import styles from "./style.module.scss";
import Link from "next/link";
import { blogdata } from "@/lib/constants";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({ subsets: ["latin"] });

export default function Footer() {
	return (
		<div className={styles.footer}>
			<div className={styles.content}>
				<div className={styles.text}>
					<div className={`${styles.title} ${orbitron.className}`}>
						{blogdata.blogName}
					</div>
					<div className={`${styles.description}`}>
						© 2023 DongYoung Kim. All rights reserved.
					</div>
					<div className={`${styles.description}`}>
						Thank you for visiting my blog. Your interest gives me a great
						strength.
					</div>
				</div>
				<div className={styles.button}>
					<div className={styles.githubIcon}>
						<Link href={blogdata.githubLink}>
							<GithubMark />
						</Link>
					</div>
					<div className={styles.dmButton}>
						<DarkModeButton />
					</div>
				</div>
			</div>
		</div>
	);
}
