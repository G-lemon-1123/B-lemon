#include<iostream>
#include<fstream>
#include<cstdlib>
using namespace std;
int yue(int a, int b)
{
	a = abs(a);
	b = abs(b);
	while (b != 0)
	{
		int r = a % b;
		a = b;
		b = r;
	}
	return a;
}
int bei(int a, int b)
{
	return abs(a*b) / yue(a, b);
}
int main()
{
	ifstream fin("number.txt");
	ofstream fout("DX126E03_3.txt");
	if (!fin.is_open())
	{
		cout << "无法打开number.txt!" << endl;
		return 1;
	}
	if (!fout.is_open())
	{
		cout << "无法创建输出文件！" << endl;
		return 1;
	}
	fout << "number1\tnumber2\t最小公倍数\t最大公约数" << endl;
	int x, y;
	while (fin >> x >> y)
	{
		fout << x << "\t" << y << "\t" << bei(x,y) << "\t\t" << yue(x,y) << endl;
	}
	fin.close();
	fout.close();
	return 0;
}