#include<iostream>
#include<iomanip>
#include<cmath>
using namespace std;
int main()
{
	cout << fixed << setprecision(3) << endl;
	const double PI = 3.1415926;
	int d, H;
	cout << "请输入圆柱的底面直径：（单位：cm）" << endl;
	cin >> d;
	cout << "请输入圆柱的高：（单位：mm）" << endl;
	cin >> H;
	double h = H * 0.1;
	double S = 2*PI * (d / 2)*(d / 2)+PI*d*h;
	double V = PI * (d / 2)*(d / 2)*h;
	cout << "圆柱的表面积是：" << S << "单位（cm*cm)\n" << endl;
	cout << "圆柱的体积是：" << V <<"单位（cm*cm*cm）"<< endl;

	double x1, y1, x2, y2;
	cout << "请输入平面上两点P1(x1,y1)，P2(x2,y2)的坐标：" << endl;
	cin >> x1>>y1>> x2>>y2;
	double d1 = x2 - x1;
	double d2 = y2 - y1;
	double D = sqrt(d1*d1 + d2 * d2);
	cout << "平面上两点P1P2的距离是：" << D << endl;

	double F;
	cout << "请输入华氏温度：" << endl;
	cin >> F;
	double C = (F - 32) * 5 / 9;
	cout << "对应的摄氏温度是：" << C << endl;
	return 0;
}