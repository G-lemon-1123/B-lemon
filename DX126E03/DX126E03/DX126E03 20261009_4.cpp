#include<iostream>
using namespace std;
int main()
{
	cout << "-----C++基本数据类型所占字节数---------" <<  endl;
	cout << "数据类型      字节数" << endl;
	
	cout << "bool          "<<sizeof(bool)<<"\n";//
	cout << "char          "<<sizeof(char) << "\n";//
	cout << "unsigned char "<<sizeof(unsigned char) << "\n";//
	cout << "short         "<<sizeof(short) << "\n";//
    cout << "int           "<<sizeof(int) << "\n";//
	cout << "unsigned int  "<<sizeof(unsigned int) << "\n";//
	cout << "long int      "<<sizeof(long int) << "\n";//
	cout << "long long     "<<sizeof(long long) << "\n";//
	cout << "float         "<<sizeof(float) << "\n";//
	cout << "double        "<<sizeof(double) << "\n";//
	return 0;
}