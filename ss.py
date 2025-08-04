import threading
import time
import requests
import concurrent.futures
from multiprocessing import Process, Queue
import os

print("=== Python 多线程真相揭秘 ===\n")

# 1. CPU 密集型任务：GIL 的限制明显
def cpu_intensive_task(n):
    """CPU 密集型任务"""
    result = 0
    for i in range(n):
        result += i * i
    return result

print("1. CPU 密集型任务对比")
print("-" * 40)

# 单线程版本
start = time.time()
result1 = cpu_intensive_task(5000000)
result2 = cpu_intensive_task(5000000)
single_thread_time = time.time() - start
print(f"单线程执行时间: {single_thread_time:.2f}秒")

# 多线程版本
start = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
    future1 = executor.submit(cpu_intensive_task, 5000000)
    future2 = executor.submit(cpu_intensive_task, 5000000)
    result1 = future1.result()
    result2 = future2.result()
multi_thread_time = time.time() - start
print(f"多线程执行时间: {multi_thread_time:.2f}秒")
print(f"性能提升: {single_thread_time/multi_thread_time:.2f}x")
print("结论: CPU密集型任务，多线程几乎无性能提升（GIL限制）\n")

# 2. I/O 密集型任务：多线程有明显优势
def io_intensive_task():
    """I/O 密集型任务"""
    try:
        # 模拟网络请求
        response = requests.get('https://httpbin.org/delay/1', timeout=3)
        return response.status_code
    except:
        # 如果网络不可用，用 sleep 模拟 I/O 等待
        time.sleep(1)
        return 200

print("2. I/O 密集型任务对比")
print("-" * 40)

# 单线程版本
start = time.time()
results = []
for i in range(3):
    results.append(io_intensive_task())
single_thread_io_time = time.time() - start
print(f"单线程I/O执行时间: {single_thread_io_time:.2f}秒")

# 多线程版本
start = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    futures = [executor.submit(io_intensive_task) for _ in range(3)]
    results = [future.result() for future in futures]
multi_thread_io_time = time.time() - start
print(f"多线程I/O执行时间: {multi_thread_io_time:.2f}秒")
print(f"性能提升: {single_thread_io_time/multi_thread_io_time:.2f}x")
print("结论: I/O密集型任务，多线程有显著性能提升\n")

# 3. 展示真正的并发执行
print("3. 线程并发执行演示")
print("-" * 40)

def worker(thread_id, shared_list, lock):
    """工作线程"""
    for i in range(5):
        with lock:
            shared_list.append(f"线程{thread_id}-任务{i}")
        time.sleep(0.1)  # I/O等待时，其他线程可以执行

shared_data = []
lock = threading.Lock()

# 创建多个线程
threads = []
start = time.time()
for i in range(3):
    t = threading.Thread(target=worker, args=(i, shared_data, lock))
    threads.append(t)
    t.start()

# 等待所有线程完成
for t in threads:
    t.join()

end = time.time()
print(f"3个线程并发执行完成，用时: {end-start:.2f}秒")
print(f"共处理了 {len(shared_data)} 个任务")
print("任务执行顺序（注意线程交替）:")
for item in shared_data:
    print(f"  {item}")

# 4. 多进程对比（真正的并行）
print("\n4. 多进程 vs 多线程对比")
print("-" * 40)

def cpu_task_for_process(n):
    """用于多进程的CPU任务"""
    result = 0
    for i in range(n):
        result += i * i
    return result

if __name__ == '__main__':
    # 多进程版本（需要在 if __name__ == '__main__' 中执行）
    print("多进程可以真正并行执行CPU密集型任务")
    
    # 注意：实际测试需要在独立的 .py 文件中运行
    print("（完整的多进程测试需要在独立文件中运行）")

print("\n=== GIL 详解 ===")
print("-" * 40)
print("""
GIL (Global Interpreter Lock) 的作用：
1. 保护 Python 对象的引用计数
2. 简化 CPython 的内存管理
3. 避免多线程同时修改 Python 对象导致的数据竞争

GIL 的释放时机：
1. I/O 操作时（文件读写、网络请求等）
2. 调用 C 扩展时
3. 执行一定数量的字节码后（约100个字节码指令）
4. time.sleep() 等阻塞操作

因此：
✅ I/O 密集型任务：多线程有效（线程在等待I/O时释放GIL）
❌ CPU 密集型任务：多线程无效（GIL限制并行执行）
✅ CPU 密集型任务：多进程有效（每个进程有自己的GIL）
""")

print("\n=== 解决方案 ===")
print("-" * 40)
print("""
1. I/O 密集型：使用多线程
   - 网络请求、文件操作、数据库查询
   - threading 模块或 concurrent.futures.ThreadPoolExecutor

2. CPU 密集型：使用多进程
   - 数学计算、图像处理、数据分析
   - multiprocessing 模块或 concurrent.futures.ProcessPoolExecutor

3. 异步编程：使用 asyncio
   - 高并发 I/O 操作
   - async/await 语法

4. 其他 Python 实现：
   - Jython (Java平台) - 没有GIL
   - IronPython (.NET平台) - 没有GIL
   - PyPy (JIT编译) - 有GIL但性能更好
""")

print("\n=== 线程安全问题 ===")
print("-" * 40)
print("""
线程安全问题：
1. 竞态条件（Race Condition）
2. 死锁（Deadlock）
3. 饥饿（Starvation）
4. 活锁（Livelock）
""")