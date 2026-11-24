#include<iostream>
#include<fstream>
using namespace std;
int main()
{
	ofstream fout("DX126E03_3.txt");
	if (!fout)
	{
		cout << "文件打开失败！" << endl;
		return 1;
	}
	fout << "所有水仙花数：" << endl;
	for (int n = 100; n <= 999; n++)
	{
		int bai = n / 100;
		int shi = n / 10 % 10;
		int ge = n % 10;
		if (bai*bai*bai + shi * shi*shi + ge * ge*ge == n)
		{
			fout << n << " ";
		}
	}
	fout << "\n\n";
	fout << "(2)满足商等于各位平方和的三位数：\n";
	for (int n = 100; n <= 999; n++)
	{
		int bai = n / 100;
		int shi = n / 10 % 10;
		int ge = n % 10;
		int shang = n / 11;
		int pingfanghe = bai * bai + shi * shi + ge * ge;
		if (shang == pingfanghe)
		{
			fout << n << " ";
		}
	}
	fout << "\n";
	fout.close();
	cout << "结果已存入DX126E03_3.txt" << endl;
	return 0;
}