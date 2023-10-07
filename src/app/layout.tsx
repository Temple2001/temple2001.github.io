import Children from "@/components/Children";
import "./global.scss";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import Layout from "@/components/layout";

export default function RootLayout({ children }: Children) {
	return (
		<html lang="ko">
			<body>
				<Layout>{children}</Layout>
			</body>
		</html>
	);
}
